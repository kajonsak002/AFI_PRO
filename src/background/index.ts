import { queueManager } from './queue/queueManager';
import { settingsStore } from './storage/settingsStore';
import { productStore } from './storage/productStore';
import { showcaseClient } from './services/showcaseClient';
import { logger } from './services/logger';

// 1. Initialize Service Worker & Side Panel behavior on install
chrome.runtime.onInstalled.addListener(async () => {
  logger.info('RUAYRUAY Extension Service Worker installed.');
  
  try {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      logger.info('Side panel behavior set: openPanelOnActionClick = true');
    }
  } catch (err) {
    logger.warn(`Failed to configure side panel behavior: ${(err as Error).message}`);
  }

  await queueManager.initialize();
  await settingsStore.getSettings();
  await productStore.initialize();
});

// 2. Lifecycle wakeup & crash recovery
queueManager.initialize().catch((err) => {
  logger.error(`Queue initialization error: ${(err as Error).message}`);
});
productStore.initialize().catch(() => {});

// 3. Central Message Router for Dashboard and Side Panel
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handleMessage = async () => {
    switch (request.type) {
      case 'CHECK_TIKTOK_LOGIN': {
        const result = await showcaseClient.checkLoginStatus();
        return { success: true, ...result };
      }

      case 'FETCH_SHOWCASE_PRODUCTS': {
        try {
          const result = await showcaseClient.fetchAllProducts({
            pageSize: request.payload?.pageSize || 20,
            maxPages: request.payload?.maxPages || 50,
          });
          await productStore.saveProducts(result.products);
          return { success: true, count: result.products.length, total: result.total };
        } catch (fetchErr) {
          return { success: false, message: (fetchErr as Error).message };
        }
      }

      case 'GET_CACHED_PRODUCTS': {
        const products = await productStore.getProducts();
        const categories = await productStore.getCategories();
        return { success: true, products, categories };
      }

      case 'MARK_PRODUCT_POSTED': {
        await productStore.markProductAsPosted(request.payload?.productId);
        return { success: true };
      }

      case 'GET_QUEUE': {
        const queue = await queueManager.getQueue();
        return { success: true, queue, isPaused: queueManager.isQueuePaused() };
      }

      case 'CREATE_JOB': {
        const job = await queueManager.createJob(request.payload);
        return { success: true, job };
      }

      case 'PAUSE_QUEUE': {
        queueManager.pause();
        return { success: true, isPaused: true };
      }

      case 'RESUME_QUEUE': {
        queueManager.resume();
        return { success: true, isPaused: false };
      }

      case 'EMERGENCY_STOP': {
        queueManager.emergencyStop();
        return { success: true, isPaused: true };
      }

      case 'GET_SETTINGS': {
        const settings = await settingsStore.getSettings();
        return { success: true, settings };
      }

      case 'SAVE_SETTINGS': {
        const updated = await settingsStore.saveSettings(request.payload);
        return { success: true, settings: updated };
      }

      case 'TEST_DEEPSEEK_KEY': {
        const apiKey = request.payload?.apiKey;
        if (!apiKey || !apiKey.trim()) {
          return { success: false, message: 'กรุณากรอก API Key ก่อนทดสอบ' };
        }

        try {
          const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: request.payload?.model || 'deepseek-chat',
              messages: [{ role: 'user', content: 'Say OK' }],
              max_tokens: 5,
            }),
          });

          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}));
            return {
              success: false,
              message: `API ตอบกลับ HTTP ${res.status}: ${errorJson.error?.message || res.statusText}`,
            };
          }

          return { success: true, message: 'เชื่อมต่อ DeepSeek API สำเร็จ! Key ถูกต้อง' };
        } catch (fetchErr) {
          return {
            success: false,
            message: `เชื่อมต่อไปยัง DeepSeek ล้มเหลว: ${(fetchErr as Error).message}`,
          };
        }
      }

      case 'GET_LOGS': {
        return { success: true, logs: logger.getLogs() };
      }

      case 'CLEAR_LOGS': {
        logger.clear();
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown message type: ${request.type}` };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true; // Keep message channel open for async response
});
