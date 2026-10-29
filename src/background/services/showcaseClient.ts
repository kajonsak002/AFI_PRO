import { Product } from '../../types';
import { logger } from './logger';

const SHOWCASE_LIST_URL = 'https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list';

export function extractImageUrl(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    val = val.trim();
    if (val === '[object Object]' || val.includes('[object Object]')) return '';
    if (
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('//') ||
      val.startsWith('data:image/')
    ) {
      return val.startsWith('//') ? 'https:' + val : val;
    }
    // TikTok CDN URI format e.g. tos-maliva-i-o3syd03w52-us/xxx or tos-alisg-i-0000/xxx
    if (val.startsWith('tos-') || val.includes('/tos-')) {
      const uri = val.startsWith('/') ? val.slice(1) : val;
      return `https://p16-va.tiktokcdn.com/obj/${uri}`;
    }
    return '';
  }

  if (Array.isArray(val)) {
    for (const sub of val) {
      const res = extractImageUrl(sub);
      if (res) return res;
    }
    return '';
  }

  if (typeof val === 'object') {
    const candidates = [
      val.url,
      val.thumb_url,
      val.url_list,
      val.thumb_url_list,
      val.urls,
      val.original_url,
      val.origin_url,
      val.header_image_url,
      val.main_url,
      val.cover,
      val.cover_url,
      val.image_url,
      val.img_url,
      val.pic_url,
      val.uri,
    ];
    for (const c of candidates) {
      const res = extractImageUrl(c);
      if (res) return res;
    }
    for (const v of Object.values(val)) {
      if (typeof v === 'string' || typeof v === 'object') {
        const res = extractImageUrl(v);
        if (res) return res;
      }
    }
  }

  return '';
}

export class ShowcaseClient {
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * ตรวจสอบสถานะการ Login ของ TikTok โดยการยิง API ทดสอบ 1 รายการ
   */
  public async checkLoginStatus(): Promise<{ loggedIn: boolean; message: string }> {
    try {
      const url = `${SHOWCASE_LIST_URL}?offset=0&count=1`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            loggedIn: false,
            message: `Session TikTok หมดอายุ (HTTP ${res.status}) กรุณาล็อกอินที่ shop.tiktok.com`,
          };
        }
        return {
          loggedIn: false,
          message: `TikTok API ตอบกลับ HTTP ${res.status}`,
        };
      }

      const bdturing = res.headers.get('bdturing-verify');
      if (bdturing) {
        return {
          loggedIn: false,
          message: 'TikTok ตรวจพบ CAPTCHA/Verification กรุณาเปิดเว็บ TikTok Shop บนเบราว์เซอร์',
        };
      }

      const json = await res.json().catch(() => ({}));
      if (json.code !== 0 && json.error_code !== 0 && !json.data) {
        return {
          loggedIn: false,
          message: json.message || json.msg || 'ยังไม่ได้เข้าสู่ระบบ TikTok Shop',
        };
      }

      return {
        loggedIn: true,
        message: 'เชื่อมต่อ TikTok Shop สำเร็จ Session ใช้งานได้ปกติ',
      };
    } catch (err) {
      return {
        loggedIn: false,
        message: `เชื่อมต่อ TikTok API ล้มเหลว: ${(err as Error).message}`,
      };
    }
  }

  /**
   * ดึงรายการสินค้าทั้งหมดจาก Showcase ด้วยการวนลูป Pagination
   */
  public async fetchAllProducts(options?: {
    pageSize?: number;
    maxPages?: number;
    onProgress?: (fetchedCount: number, total: number) => void;
  }): Promise<{ products: Product[]; total: number }> {
    const pageSize = options?.pageSize || 20;
    const maxPages = options?.maxPages || 50;
    const allProducts: Product[] = [];
    let offset = 0;
    let total = Infinity;
    let pageCount = 0;

    logger.info(`เริ่มดึงสินค้า Showcase จาก TikTok API (ทีละ ${pageSize} ชิ้น)...`);

    while (offset < total && pageCount < maxPages) {
      pageCount++;
      const url = `${SHOWCASE_LIST_URL}?offset=${offset}&count=${pageSize}`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
          credentials: 'include',
        });
      } catch (netErr) {
        const msg = `เชื่อมต่อ TikTok Shop API ล้มเหลว: ${(netErr as Error).message}`;
        logger.error(msg);
        throw new Error(msg);
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const authErr = `Session TikTok หมดอายุ (HTTP ${response.status}) กรุณาล็อกอินใหม่`;
          logger.error(authErr);
          throw new Error(authErr);
        }
        throw new Error(`TikTok API HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json().catch(() => ({}));
      if (json.code !== 0 && json.error_code !== 0 && !json.data) {
        const apiErr = json.message || json.msg || 'ไม่สามารถดึงข้อมูลสินค้าได้';
        logger.error(apiErr);
        throw new Error(apiErr);
      }

      const data = json.data || {};
      const items = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.list)
        ? data.list
        : Array.isArray(data.showcase_products)
        ? data.showcase_products
        : [];

      if (typeof data.total === 'number') {
        total = data.total;
      }

      if (items.length === 0) {
        break;
      }

      for (const item of items) {
        const base = item.product_base || item.base_info || item.product || item;
        const productId = String(
          item.product_id || base.product_id || item.item_id || base.item_id || item.id || ''
        );
        const title = String(
          base.title || item.title || base.name || item.name || base.product_name || 'ไม่มีชื่อสินค้า'
        ).trim();

        const coverUrl =
          extractImageUrl(base.cover) ||
          extractImageUrl(item.cover) ||
          extractImageUrl(item.images) ||
          '';

        const imagesList: string[] = [];
        if (Array.isArray(item.images)) {
          for (const img of item.images) {
            const u = extractImageUrl(img);
            if (u && !imagesList.includes(u)) imagesList.push(u);
          }
        }
        if (coverUrl && !imagesList.includes(coverUrl)) {
          imagesList.unshift(coverUrl);
        }

        const price = String(
          item.format_available_price ||
          base.format_available_price ||
          item.price ||
          base.price ||
          item.min_price ||
          '—'
        ).trim();

        const commission =
          item.affiliate_info?.commission_with_currency ||
          item.affiliate_info?.est_commission_expense ||
          (item.affiliate_info?.commission_rate
            ? `${item.affiliate_info.commission_rate / 100}%`
            : '—');

        const product: Product = {
          productId,
          title,
          price,
          coverUrl,
          images: imagesList,
          stock: Number(item.stock_num || base.stock_num || 0),
          commission,
          category: item.category_info?.name || base.category_name || 'ทั่วไป',
          shopName: item.seller_info?.shop_name || 'TikTok Shop',
          updatedAt: Date.now(),
        };

        allProducts.push(product);
      }

      offset += items.length;
      if (options?.onProgress) {
        options.onProgress(allProducts.length, total === Infinity ? allProducts.length : total);
      }

      // Small delay between pagination calls to be gentle to TikTok servers
      await this.sleep(350);
    }

    logger.success(`ดึงสินค้าจาก Showcase สำเร็จทั้งหมด ${allProducts.length} รายการ`);
    return {
      products: allProducts,
      total: total === Infinity ? allProducts.length : total,
    };
  }
}

export const showcaseClient = new ShowcaseClient();
