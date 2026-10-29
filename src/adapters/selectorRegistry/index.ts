export interface SelectorDefinition {
  name: string;
  description: string;
  primary: string;
  fallbacks: string[];
}

export const META_AI_SELECTORS = {
  composer: {
    name: 'composer',
    description: 'Prompt input textarea or contenteditable element in Meta AI',
    primary: "textarea[placeholder*='Ask' i], div[contenteditable='true'][role='textbox']",
    fallbacks: [
      "[data-lexical-editor='true']",
      ".ProseMirror[contenteditable='true']",
      "div[contenteditable='true']",
      "textarea"
    ]
  },
  sendButton: {
    name: 'sendButton',
    description: 'Send arrow button in Meta AI',
    primary: ".ms-auto.flex.items-center.gap-2 button",
    fallbacks: [
      "button[aria-label*='Send' i]",
      "button[aria-label*='ส่ง' i]",
      "[data-testid*='send-button' i]",
      "button:has(svg path[d*='M2.01 21L23 12 2.01 3'])"
    ]
  },
  fileInput: {
    name: 'fileInput',
    description: 'File upload input for attaching product reference image',
    primary: "input[type='file'][accept*='image']",
    fallbacks: [
      "input[type='file']"
    ]
  },
  mediaDialog: {
    name: 'mediaDialog',
    description: 'Dialog popup that appears after uploading media',
    primary: "[role='dialog'], [aria-modal='true']",
    fallbacks: [
      "div:has(> h2:has-text('Add media and files'))"
    ]
  },
  mediaDialogClose: {
    name: 'mediaDialogClose',
    description: 'Close/X button on Add media dialog',
    primary: "button[aria-label*='Close' i], button[aria-label*='ปิด' i]",
    fallbacks: [
      "button[title*='Close' i]",
      "[data-testid*='xmark' i]",
      "button:has(svg[data-testid*='close' i])"
    ]
  },
  videoPlayer: {
    name: 'videoPlayer',
    description: 'Generated video element in chat response',
    primary: "video[src]",
    fallbacks: [
      "video",
      "a[download][href*='.mp4']"
    ]
  }
};

export const FLOW_SELECTORS = {
  promptInput: {
    name: 'promptInput',
    description: 'Prompt input field in Google Flow',
    primary: "div[contenteditable='true'][role='textbox']",
    fallbacks: [
      "p[contenteditable='true']",
      "textarea",
      "div.sc-5c3af813-3.dpylNZ div p"
    ]
  },
  addIngredientButton: {
    name: 'addIngredientButton',
    description: 'Button to add image as ingredient',
    primary: "button[aria-label*='Add ingredient' i], button[aria-label*='เพิ่ม' i]",
    fallbacks: [
      "button:has-text('Add to prompt')",
      "button:has-text('เพิ่มไปยังพรอมต์')"
    ]
  },
  ingredientChip: {
    name: 'ingredientChip',
    description: 'Visual chip confirming ingredient is attached in prompt composer',
    primary: "img[data-testid*='ingredient' i], [class*='ingredient-chip']",
    fallbacks: [
      "div[contenteditable='true'] img"
    ]
  },
  stopButton: {
    name: 'stopButton',
    description: 'Stop/Cancel button while generating',
    primary: "button[aria-label*='Stop' i], button:has-text('Stop')",
    fallbacks: [
      "button:has-text('Cancel')",
      "button:has-text('หยุด')"
    ]
  }
};

export const TIKTOK_STUDIO_SELECTORS = {
  videoDropzone: {
    name: 'videoDropzone',
    description: 'Dropzone or file input for video upload',
    primary: "input[type='file'][accept*='video']",
    fallbacks: [
      "div[class*='dropzone']",
      "div[data-e2e='upload_zone']"
    ]
  },
  captionEditor: {
    name: 'captionEditor',
    description: 'Caption editor field in TikTok Studio',
    primary: "div[data-e2e='caption-editor'], [contenteditable='true']",
    fallbacks: [
      "div[role='combobox']",
      "div[class*='editor-container'] [contenteditable='true']"
    ]
  },
  scheduleRadio: {
    name: 'scheduleRadio',
    description: 'Schedule post radio button',
    primary: "input[name='postSchedule'][value='schedule']",
    fallbacks: [
      "input[type='radio'][value='schedule']",
      "[role='radio']:has-text('Schedule')"
    ]
  },
  dateInput: {
    name: 'dateInput',
    description: 'Date picker input for scheduling',
    primary: "input[type='date'], [class*='date-picker'] input",
    fallbacks: [
      "input[placeholder*='YYYY' i]",
      "[role='combobox']:has-text('202')"
    ]
  },
  timePickerColumn: {
    name: 'timePickerColumn',
    description: 'Two-column hour/minute pickers',
    primary: "[class*='time-picker'], [role='dialog']:has([role='option'])",
    fallbacks: [
      "input[type='time']",
      "div[class*='scroll-column']"
    ]
  },
  productAnchorButton: {
    name: 'productAnchorButton',
    description: 'Button to add Showcase product link / basket',
    primary: "[class*='anchor-entry-container'], button[data-e2e='add-product-link']",
    fallbacks: [
      "button:has-text('Product')",
      "button:has-text('สินค้า')",
      "div:has-text('Add link'):has(button)"
    ]
  },
  productSearchInput: {
    name: 'productSearchInput',
    description: 'Search box inside product selection dialog',
    primary: "input[placeholder*='Product ID' i], input[placeholder*='ค้นหา' i]",
    fallbacks: [
      "input[data-e2e='search-product']",
      "[role='dialog'] input[type='text']"
    ]
  },
  aiContentToggle: {
    name: 'aiContentToggle',
    description: 'AI-generated content disclosure switch',
    primary: "[role='switch'][aria-label*='AI' i], input[type='checkbox'][name*='ai' i]",
    fallbacks: [
      "div:has-text('AI-generated content') input[type='checkbox']",
      "div:has-text('เนื้อหาที่สร้างด้วย AI') input[type='checkbox']"
    ]
  },
  postButton: {
    name: 'postButton',
    description: 'Final Post or Schedule button',
    primary: "button[data-e2e='post_video_button'], button[data-e2e='post-button']",
    fallbacks: [
      "button:has-text('Schedule')",
      "button:has-text('กำหนดเวลา')",
      "button:has-text('Post')",
      "button:has-text('โพสต์')"
    ]
  },
  finalConfirmButton: {
    name: 'finalConfirmButton',
    description: 'Confirmation button in the final modal popup',
    primary: "[role='dialog'] button:has-text('Post now'), [role='dialog'] button:has-text('Schedule')",
    fallbacks: [
      "[role='dialog'] button[data-e2e*='confirm' i]",
      "[role='dialog'] button:has-text('ยืนยัน')",
      "[role='dialog'] button:has-text('ดำเนินการต่อ')"
    ]
  }
};
