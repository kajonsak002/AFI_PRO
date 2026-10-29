import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShowcaseClient, extractImageUrl } from '../src/background/services/showcaseClient';
import { ProductStore } from '../src/background/storage/productStore';

describe('extractImageUrl', () => {
  it('extracts direct HTTP and HTTPS URLs', () => {
    expect(extractImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    expect(extractImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
    expect(extractImageUrl('//example.com/img.webp')).toBe('https://example.com/img.webp');
  });

  it('converts TikTok tos-* URIs to full CDN URLs', () => {
    expect(extractImageUrl('tos-alisg-i-0000/12345678.jpg')).toBe(
      'https://p16-va.tiktokcdn.com/obj/tos-alisg-i-0000/12345678.jpg'
    );
    expect(extractImageUrl('/tos-maliva-i-03syd03w52-us/abcd.jpg')).toBe(
      'https://p16-va.tiktokcdn.com/obj/tos-maliva-i-03syd03w52-us/abcd.jpg'
    );
  });

  it('extracts URL from nested objects and arrays', () => {
    const objWithUrlList = {
      url_list: ['https://p16-va.tiktokcdn.com/obj/1.jpg'],
    };
    expect(extractImageUrl(objWithUrlList)).toBe('https://p16-va.tiktokcdn.com/obj/1.jpg');

    const nestedCover = {
      cover: {
        thumb_url_list: ['https://p16-va.tiktokcdn.com/obj/thumb.jpg'],
      },
    };
    expect(extractImageUrl(nestedCover)).toBe('https://p16-va.tiktokcdn.com/obj/thumb.jpg');
  });

  it('rejects [object Object] and invalid values safely', () => {
    expect(extractImageUrl('[object Object]')).toBe('');
    expect(extractImageUrl(null)).toBe('');
    expect(extractImageUrl(undefined)).toBe('');
  });
});

describe('ShowcaseClient', () => {
  let client: ShowcaseClient;

  beforeEach(() => {
    client = new ShowcaseClient();
    vi.restoreAllMocks();
  });

  it('detects successful login when TikTok API returns code 0', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        code: 0,
        data: {
          products: [{ product_id: '1001', title: 'Product A' }],
          total: 1,
        },
      }),
    } as any);

    const status = await client.checkLoginStatus();
    expect(status.loggedIn).toBe(true);
  });

  it('detects expired session when API returns HTTP 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
    } as any);

    const status = await client.checkLoginStatus();
    expect(status.loggedIn).toBe(false);
    expect(status.message).toContain('Session TikTok หมดอายุ');
  });

  it('detects verification/CAPTCHA challenge via bdturing header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (header: string) => (header === 'bdturing-verify' ? 'challenge_token' : null),
      },
    } as any);

    const status = await client.checkLoginStatus();
    expect(status.loggedIn).toBe(false);
    expect(status.message).toContain('CAPTCHA');
  });

  it('parses product schema correctly and paginates', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        data: {
          total: 1,
          products: [
            {
              product_id: '1729111222333',
              title: 'สบู่วิตามินซี แล็บโซพ',
              format_available_price: '฿120',
              stock_num: 350,
              cover: { url_list: ['https://p16-va.tiktokcdn.com/cover.jpg'] },
              images: [{ url_list: ['https://p16-va.tiktokcdn.com/img1.jpg'] }],
              affiliate_info: { commission_with_currency: '฿18' },
              category_info: { name: 'สกินแคร์' },
              seller_info: { shop_name: 'LAB SOAP Official' },
            },
          ],
        },
      }),
    } as any);

    const result = await client.fetchAllProducts({ pageSize: 1, maxPages: 1 });
    expect(result.products.length).toBe(1);

    const item = result.products[0];
    expect(item.productId).toBe('1729111222333');
    expect(item.title).toBe('สบู่วิตามินซี แล็บโซพ');
    expect(item.price).toBe('฿120');
    expect(item.stock).toBe(350);
    expect(item.coverUrl).toBe('https://p16-va.tiktokcdn.com/cover.jpg');
    expect(item.commission).toBe('฿18');
    expect(item.category).toBe('สกินแคร์');
    expect(item.shopName).toBe('LAB SOAP Official');
  });
});

describe('ProductStore', () => {
  let store: ProductStore;

  beforeEach(() => {
    store = new ProductStore();
  });

  it('saves and filters products by category and tracks posted state', async () => {
    await store.saveProducts([
      {
        productId: 'p_1',
        title: 'ครีมกันแดด',
        price: '฿250',
        coverUrl: '',
        images: [],
        stock: 100,
        commission: '10%',
        category: 'ความงาม',
        shopName: 'Shop A',
        updatedAt: Date.now(),
      },
      {
        productId: 'p_2',
        title: 'หม้อทอดไร้น้ำมัน',
        price: '฿890',
        coverUrl: '',
        images: [],
        stock: 50,
        commission: '15%',
        category: 'เครื่องใช้ไฟฟ้า',
        shopName: 'Shop B',
        updatedAt: Date.now(),
      },
    ]);

    const all = await store.getProducts();
    expect(all.length).toBe(2);

    const categories = await store.getCategories();
    expect(categories).toContain('ความงาม');
    expect(categories).toContain('เครื่องใช้ไฟฟ้า');

    expect(await store.isProductPosted('p_1')).toBe(false);
    await store.markProductAsPosted('p_1');
    expect(await store.isProductPosted('p_1')).toBe(true);
  });
});
