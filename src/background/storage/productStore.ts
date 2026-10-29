import { Product } from '../../types';
import { logger } from '../services/logger';

const PRODUCTS_STORAGE_KEY = 'ruayruay_products';
const POSTED_IDS_STORAGE_KEY = 'ruayruay_posted_product_ids';

export class ProductStore {
  private products: Map<string, Product> = new Map();
  private postedProductIds: Set<string> = new Set();
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const stored = await chrome.storage.local.get([
          PRODUCTS_STORAGE_KEY,
          POSTED_IDS_STORAGE_KEY,
        ]);

        const list: Product[] = stored[PRODUCTS_STORAGE_KEY] || [];
        list.forEach((p) => this.products.set(p.productId, p));

        const posted: string[] = stored[POSTED_IDS_STORAGE_KEY] || [];
        this.postedProductIds = new Set(posted);

        logger.info(`ProductStore loaded ${list.length} products, ${posted.length} marked as posted.`);
      } catch (err) {
        logger.error(`Failed to load products from chrome.storage: ${(err as Error).message}`);
      }
    }
    this.initialized = true;
  }

  public async saveProducts(newProducts: Product[]): Promise<void> {
    await this.initialize();

    for (const p of newProducts) {
      if (p.productId) {
        this.products.set(p.productId, p);
      }
    }

    await this.persist();
  }

  public async getProducts(): Promise<Product[]> {
    await this.initialize();
    return Array.from(this.products.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public async getProductById(productId: string): Promise<Product | undefined> {
    await this.initialize();
    return this.products.get(productId);
  }

  public async getCategories(): Promise<string[]> {
    await this.initialize();
    const categories = new Set<string>();
    for (const p of this.products.values()) {
      if (p.category) {
        categories.add(p.category);
      }
    }
    return Array.from(categories);
  }

  public async isProductPosted(productId: string): Promise<boolean> {
    await this.initialize();
    return this.postedProductIds.has(productId);
  }

  public async markProductAsPosted(productId: string): Promise<void> {
    await this.initialize();
    this.postedProductIds.add(productId);

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({
        [POSTED_IDS_STORAGE_KEY]: Array.from(this.postedProductIds),
      });
    }
  }

  public async clearAll(): Promise<void> {
    await this.initialize();
    this.products.clear();
    this.postedProductIds.clear();

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove([PRODUCTS_STORAGE_KEY, POSTED_IDS_STORAGE_KEY]);
    }
  }

  private async persist(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const list = Array.from(this.products.values());
      await chrome.storage.local.set({ [PRODUCTS_STORAGE_KEY]: list });
    }
  }
}

export const productStore = new ProductStore();
