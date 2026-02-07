# Smart Home IL - Telegram Deal Channel Setup

## Overview

Automated Telegram deal channel posting 3 smart home product deals per day + weekly Friday digest.

**Architecture:**
```
n8n Schedule (3x/day) → Fetch Products from Website → Pick & Format → Telegram Bot API
n8n Schedule (Friday) → Weekly Digest from tracked posts → Telegram Bot API
```

---

## Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `בית חכם IL - דילים` (or similar)
4. Choose a username: `SmartHomeIL_bot` (must end with `_bot`)
5. **Copy the bot token** — you'll need it in Step 3

## Step 2: Create Telegram Channel

1. Open Telegram → New Channel
2. Name: `בית חכם IL - דילים יומיים`
3. Description:
   ```
   🏠 דילים יומיים על מוצרי בית חכם לישראל
   ⚡ כל מוצר מאומת ל-220V
   🏡 תאימות Home Assistant
   📖 מדריכים: https://ziv-daniel.github.io/smart-income/
   ```
4. Set as **Public** channel
5. Choose username: `SmartHomeIL` (or available alternative)
6. **Add your bot as admin:**
   - Channel Settings → Administrators → Add Administrator
   - Search for your bot username (e.g., `SmartHomeIL_bot`)
   - Grant permission: **Post Messages**

## Step 3: Configure the n8n Workflow

### Import the Workflow

1. Open n8n at `https://n8n.danielshaprvt.work/`
2. Go to **Workflows** → **Add Workflow** → **Import from File**
3. Select `smart-home-deals-workflow.json` from this folder
4. The workflow will appear with 7 nodes in two flows

### Set Bot Token & Channel ID

In the workflow, open **both** Code nodes (`Pick & Format Deal` and `Format Weekly Digest`) and edit the configuration at the top:

```javascript
// ===== CONFIGURATION - EDIT THESE! =====
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';  // ← paste bot token from Step 1
const CHANNEL_ID = '@SmartHomeIL';        // ← your channel username (or numeric ID)
// ========================================
```

**Finding numeric Channel ID** (if using private channel):
- Forward any message from the channel to `@userinfobot`
- It will return the channel ID (starts with `-100`)

### Deploy Products Database

The workflow fetches products from your GitHub Pages site. Make sure to push the `telegram-bot/` folder to GitHub:

```bash
git add telegram-bot/products-database.json
git commit -m "feat: add product database for Telegram channel"
git push
```

Wait ~2 minutes for GitHub Pages to deploy, then verify the URL works:
```
https://ziv-daniel.github.io/smart-income/telegram-bot/products-database.json
```

## Step 4: Test the Workflow

1. In n8n, click **Test Workflow** (the play button) on the **Daily Deal Timer** node
2. Check each node executed successfully (green checkmarks)
3. Verify a message appeared in your Telegram channel
4. Run it again — the next product in rotation should appear

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to load products" | Push products-database.json to GitHub and wait for Pages deploy |
| 401 Unauthorized | Check bot token is correct |
| 400 Bad Request (chat not found) | Ensure bot is added as channel admin |
| No message in channel | Check CHANNEL_ID matches your channel username |
| Hebrew text garbled | Ensure parse_mode is 'HTML' in the HTTP Request body |

## Step 5: Activate

1. Toggle the workflow to **Active** (top right switch)
2. The schedule will now fire automatically:
   - **Daily deals**: 8:00, 14:00, 20:00 Israel time
   - **Weekly digest**: Friday 12:00 Israel time

---

## Product Database Management

### Adding New Products

Edit `telegram-bot/products-database.json` and add to the `products` array:

```json
{
  "id": "unique-product-id",
  "name": "Product Name (English)",
  "hebrewName": "שם המוצר בעברית",
  "category": "switches|ac-controllers|sensors|hubs|vacuums|plugs|cameras|lighting|covers|climate|controllers",
  "price": 100,
  "priceDisplay": "~₪100",
  "protocol": "Zigbee 3.0|WiFi|etc",
  "rating": 4.5,
  "verified220v": true,
  "homeAssistantSupport": "full|partial|none",
  "description": "תיאור בעברית — 1-2 משפטים.",
  "buyLink": "https://affiliate-link-here",
  "websiteLink": "https://ziv-daniel.github.io/smart-income/smart-home.html",
  "tags": ["tag1", "tag2"]
}
```

Push to GitHub — the workflow will pick up new products on the next run.

### Resetting Product Rotation

If you want to restart the product rotation cycle:
1. Open the n8n workflow
2. Click **Settings** (gear icon) → **Static Data** → Clear
3. The rotation index resets to 0

---

## Schedule Reference

| Schedule | Cron Expression | Israel Time |
|----------|-----------------|-------------|
| Morning deal | `0 8 * * *` | 08:00 |
| Afternoon deal | `0 14 * * *` | 14:00 |
| Evening deal | `0 20 * * *` | 20:00 |
| Friday digest | `0 12 * * 5` | Friday 12:00 |

**Timezone**: `Asia/Jerusalem` (set in workflow settings)

---

## Files

| File | Purpose |
|------|---------|
| `products-database.json` | 31 curated products verified for Israeli 220V |
| `smart-home-deals-workflow.json` | n8n importable workflow (7 nodes) |
| `SETUP.md` | This setup guide |
