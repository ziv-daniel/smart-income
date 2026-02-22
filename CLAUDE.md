# Claude Code Guidelines for This Project

## Critical Rules

### 1. n8n Workflow Validation Rule

**MANDATORY**: After making ANY changes to n8n workflows, you MUST:

1. **Validate the workflow** using `n8n_validate_workflow` to ensure there are no errors
2. **Verify zero errors** - The workflow must show `valid: true` and `errorCount: 0`
3. **Check recent executions** to see if the schedule triggers are firing
4. **Review error details** if executions failed

**Example validation workflow:**
```javascript
// After updating workflow
mcp__n8n-mcp__n8n_validate_workflow({ id: "workflow_id" })

// Check recent executions
mcp__n8n-mcp__n8n_executions({ action: "list", workflowId: "workflow_id", limit: 3 })

// If errors found, get details
mcp__n8n-mcp__n8n_executions({ action: "get", id: "execution_id", mode: "error" })
```

### 2. Testing Requirements

Before claiming any work is complete:
- Workflow validates with 0 errors AND 0 warnings
- Test workflow trigger actually fires
- Check execution logs for runtime errors
- Verify Telegram message is delivered to channel
- Test complete user flow end-to-end

**CRITICAL - Zero Tolerance Policy:**
- **NEVER** claim work is complete without verification
- **NEVER** ask user to test when there are errors or warnings
- **ALWAYS** run validation before claiming success
- **ALWAYS** fix ALL errors and warnings before asking for testing
- **ALWAYS** check latest execution logs
- Production-ready means: valid: true, errorCount: 0, warningCount: 0, tested end-to-end

### 3. n8n Access - IMPORTANT

**n8n runs as a Home Assistant addon, NOT on PIE5:**
- **DO NOT** try to SSH to PIE5 for n8n issues - n8n is not related to PIE5
- **DO NOT** use direct ingress URLs - they require HA authentication context
- **Access n8n UI** by navigating through Home Assistant:
  1. Go to `https://home.danielshaprvt.work/`
  2. Navigate via sidebar: Settings → Add-ons → n8n → "Open Web UI"
  3. Or use the n8n icon in the HA sidebar if configured
- **API URL**: `https://n8n.danielshaprvt.work` (API only, requires X-N8N-API-KEY header)
- **Addon slug**: `3cfc8f0f_hass-n8n`
- **Restart addon**: Use Home Assistant services (`hassio.addon_restart`)
- **Credential management**: Must be done through n8n UI (not API)

**Browser Navigation to n8n:**
1. Navigate to Home Assistant main page
2. Click sidebar menu → Settings
3. Click Add-ons
4. Find and click "n8n" addon
5. Click "Open Web UI" button

**Browser Automation Notes:**
- **ALWAYS check if browser is already open** before launching a new instance
- Use Chrome DevTools MCP (`mcp__chrome-devtools__*`) to connect to existing browser sessions
- Playwright MCP will fail if Chrome is already running with the same user profile
- If browser launch fails with "Opening in existing browser session", use DevTools instead

### 4. Telegram Bot Configuration

- **Bot**: @SmartHomeIL_deals_bot (name: "Smart Home IL Deals")
- **Channel**: @SmartHomeIL_deals ("בית חכם IL - דילים יומיים"), public
- **Channel URL**: https://t.me/SmartHomeIL_deals
- **Bot token**: stored in `telegram-bot/.env` (TELEGRAM_BOT_TOKEN)
- **Testing**: Send test messages via Telegram Bot API `sendMessage`

**Test message via Bot API:**
```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "@SmartHomeIL_deals", "text": "Test message", "parse_mode": "HTML"}'
```

### 5. n8n Workflow Backup Before Git Push

**MANDATORY**: Before pushing to git, ALWAYS export and save the current n8n workflow:

1. **Export workflow** using `mcp__n8n-mcp__n8n_get_workflow` with `mode: "full"`
2. **Save to** `telegram-bot/smart-home-deals-workflow.json`
3. **Include in commit** with any other changes

### 6. Skills-First Debugging Rule

**MANDATORY**: When debugging issues that aren't immediately solvable:
1. **ALWAYS search skills first** - Use `Glob` to find relevant skills in `~/.claude/skills/`
2. **Read matching skills** - Load and apply knowledge from skills before attempting fixes
3. **n8n-specific skills** - Always check `n8n-*` skills for workflow issues:
   - `n8n-mcp-tools-expert` - Expert guide for n8n MCP tools
   - `n8n-expression-syntax` - Expression format issues
   - `n8n-code-nodes` - Code node patterns
   - `n8n-node-configuration` - Node config requirements

### 7. Security

- **Bot token** is in `.env` file (protected by `.gitignore`)
- **NEVER** commit `.env` files to git
- **WARNING**: `smart-home-deals-workflow.json` contains hardcoded bot token - sanitize before pushing to public repo
- Check `.gitignore` includes `.env` and `.env.*`

## Project-Specific Context

### Smart Home IL - Telegram Deal Channel

**Architecture:**
```
n8n Schedule (3x/day: 8:00, 14:00, 20:00 Israel time)
  → Fetch Products from GitHub Pages
  → Pick & Format Deal (sequential rotation)
  → Telegram Bot API sendMessage to @SmartHomeIL_deals

n8n Schedule (Friday 12:00)
  → Format Weekly Digest from tracked posts
  → Telegram Bot API sendMessage to @SmartHomeIL_deals
```

**Workflow nodes (7 total):**
| Node | Type | Purpose |
|------|------|---------|
| Daily Deal Timer | Schedule Trigger | 3x/day at 8:00, 14:00, 20:00 |
| Fetch Products | HTTP Request | GET products-database.json from GitHub Pages |
| Pick & Format Deal | Code | Select next product, format Hebrew message |
| Send Deal | HTTP Request | POST to Telegram Bot API |
| Friday Digest Timer | Schedule Trigger | Every Friday 12:00 |
| Format Weekly Digest | Code | Create weekly summary |
| Send Digest | HTTP Request | POST weekly digest to Telegram |

**Product Database**: `telegram-bot/products-database.json` (31 products, 11 categories)
**Product rotation**: via `$getWorkflowStaticData('global')` - tracks currentIndex and weeklyProducts

### Schedule Reference

| Schedule | Cron Expression | Israel Time |
|----------|-----------------|-------------|
| Morning deal | `0 8 * * *` | 08:00 |
| Afternoon deal | `0 14 * * *` | 14:00 |
| Evening deal | `0 20 * * *` | 20:00 |
| Friday digest | `0 12 * * 5` | Friday 12:00 |

**Timezone**: `Asia/Jerusalem` (set in workflow settings)

## Tools & Verification

Always use these tools for verification:
- `mcp__n8n-mcp__n8n_validate_workflow` - Validate configuration
- `mcp__n8n-mcp__n8n_executions` - Check runtime behavior
- Chrome DevTools / Playwright - Visual inspection of n8n UI when needed

**CRITICAL - Environment Configuration:**
- **ALWAYS** check the `.env` file for credentials before using browser tools
- n8n URL, API keys, and other service endpoints may be stored in `.env`
- Never assume default URLs - always read from `.env` first
