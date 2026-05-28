# PerforMission — WordPress Setup Guide
**Version 1.0 | Stack: Elementor Pro + MemberPress + LearnDash + Zoho CRM**

Read this entire guide before touching WordPress. Each phase builds on the previous one. Skipping steps will break things downstream.

---

## Table of Contents
1. [File Structure Overview](#1-file-structure-overview)
2. [Server & WordPress Requirements](#2-server--wordpress-requirements)
3. [Phase 1 — Install WordPress & Required Plugins](#3-phase-1--install-wordpress--required-plugins)
4. [Phase 2 — Upload & Activate Custom Plugins](#4-phase-2--upload--activate-custom-plugins)
5. [Phase 3 — Install & Configure the Child Theme](#5-phase-3--install--configure-the-child-theme)
6. [Phase 4 — Zoho CRM Setup](#6-phase-4--zoho-crm-setup)
7. [Phase 5 — MemberPress (Roles & Login)](#7-phase-5--memberpress-roles--login)
8. [Phase 6 — LearnDash + WooCommerce (Education)](#8-phase-6--learndash--woocommerce-education)
9. [Phase 7 — Create All WordPress Pages](#9-phase-7--create-all-wordpress-pages)
10. [Phase 8 — Elementor Design & Navigation](#10-phase-8--elementor-design--navigation)
11. [Phase 9 — Configure AI Hub Webhook](#11-phase-9--configure-ai-hub-webhook)
12. [Phase 10 — Configure KPI Calculator](#12-phase-10--configure-kpi-calculator)
13. [Phase 11 — Connect Zoho CRM (OAuth)](#13-phase-11--connect-zoho-crm-oauth)
14. [Phase 12 — QA & Security Checklist](#14-phase-12--qa--security-checklist)
15. [Going Live Checklist](#15-going-live-checklist)
16. [Admin Reference Card](#16-admin-reference-card)

---

## 1. File Structure Overview

This build delivers the following files. Every folder under `plugins/` becomes a WordPress plugin. The `theme/` folder becomes a WordPress child theme.

```
performission/
├── SETUP_GUIDE.md                          ← this file
│
├── plugins/
│   ├── performission-core/                 ← UPLOAD to /wp-content/plugins/
│   │   ├── performission-core.php
│   │   ├── includes/
│   │   │   ├── class-ambassador-cpt.php
│   │   │   ├── class-roles.php
│   │   │   └── class-portal-dashboard.php
│   │   └── assets/
│   │       ├── css/portal.css
│   │       └── js/portal.js
│   │
│   ├── performission-zoho/                 ← UPLOAD to /wp-content/plugins/
│   │   ├── performission-zoho.php
│   │   ├── admin/settings-page.php
│   │   ├── includes/
│   │   │   ├── class-zoho-api.php
│   │   │   ├── class-zoho-rest-api.php
│   │   └── assets/
│   │       ├── css/dashboard.css
│   │       └── js/dashboard.js
│   │
│   ├── performission-aihub/                ← UPLOAD to /wp-content/plugins/
│   │   ├── performission-aihub.php
│   │   └── includes/class-webhook.php
│   │
│   └── performission-kpi/                  ← UPLOAD to /wp-content/plugins/
│       ├── performission-kpi.php
│       ├── includes/class-kpi-proxy.php
│       └── assets/
│           ├── css/calculator.css
│           └── js/calculator.js
│
└── theme/
    └── performission-child/                ← UPLOAD to /wp-content/themes/
        ├── style.css
        ├── functions.php
        └── templates/
            ├── single-ambassador.php
            └── archive-ambassador.php
```

---

## 2. Server & WordPress Requirements

### Minimum hosting requirements
| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| PHP | 7.4 | 8.2+ |
| MySQL | 5.7 | 8.0+ |
| WordPress | 6.3 | 6.5+ |
| Memory limit | 256 MB | 512 MB |
| SSL certificate | Required | Required |
| Server | Apache or Nginx | Nginx |

### Recommended hosting providers
- **WP Engine** — managed, fast, handles caching automatically
- **Kinsta** — managed, excellent dev tools
- **Cloudways** — flexible, good value

### WordPress install settings (do this first)
1. Install WordPress at your domain root
2. Go to **Settings → Permalinks** → choose **Post name** (`/%postname%/`) → Save
3. Go to **Settings → General** → set Site Title to `PerforMission`
4. Go to **Settings → Reading** → set `Your homepage displays` to a static page (you'll create the Home page in Phase 7)
5. Enable SSL — ensure your site URL in Settings uses `https://`

---

## 3. Phase 1 — Install WordPress & Required Plugins

Install these plugins **in this order** from WordPress.org (free) or from their official sites (paid).

### Step 1 — Free plugins from WordPress.org
Go to **Plugins → Add New** and install + activate each:

| Plugin | Search term / slug | Purpose |
|--------|-------------------|---------|
| Hello Elementor | `hello-elementor` | Parent theme (install as theme, not plugin) |
| Elementor | `elementor` | Page builder base (free, required before Pro) |
| Rank Math SEO | `seo-by-rank-math` | SEO |
| WPForms Lite | `wpforms-lite` | Contact forms (upgrade to Pro for AI Hub) |
| WooCommerce | `woocommerce` | Course checkout |
| UpdraftPlus | `updraftplus` | Backups |
| Wordfence Security | `wordfence` | Security |

> **Important:** Install Hello Elementor as a **theme** (Appearance → Themes → Add New), not as a plugin.

### Step 2 — Paid plugins (purchase licences first)
Download each from the vendor and upload via **Plugins → Add New → Upload Plugin**:

| Plugin | Where to buy | Why needed |
|--------|-------------|------------|
| **Elementor Pro** | elementor.com | Required for Theme Builder, custom templates, forms |
| **MemberPress** | memberpress.com | Membership, roles, login, access rules |
| **LearnDash** | learndash.com | LMS — courses, lessons, progress, student dashboard |

### Step 3 — LearnDash WooCommerce Integration
After installing both LearnDash and WooCommerce:
- Download the **LearnDash WooCommerce Integration** add-on from your LearnDash account
- Upload and activate it

### Activation order (important)
Activate in this order to avoid conflicts:
1. WooCommerce
2. Elementor (free)
3. Elementor Pro
4. MemberPress
5. LearnDash
6. LearnDash WooCommerce Integration
7. Rank Math
8. WPForms

---

## 4. Phase 2 — Upload & Activate Custom Plugins

These are the four custom plugins in this build.

### Upload method
**Option A — FTP/SFTP (recommended)**
1. Connect to your server via FTP (FileZilla or similar)
2. Navigate to `/wp-content/plugins/`
3. Upload the four folders from `performission/plugins/`:
   - `performission-core/`
   - `performission-zoho/`
   - `performission-aihub/`
   - `performission-kpi/`

**Option B — WordPress admin upload**
1. Zip each plugin folder individually (e.g. `performission-core.zip`)
2. Go to **Plugins → Add New → Upload Plugin**
3. Upload and install each zip

### Activation order for custom plugins
1. **PerforMission Core** — activate first (registers roles and CPT)
2. **PerforMission Zoho CRM** — activate second
3. **PerforMission AI Hub** — activate third
4. **PerforMission KPI Calculator** — activate last

### Verify activation
After activating all four, check:
- **Plugins list** → all four show as "Active" with no errors
- **WordPress menu** → you should see a **PerforMission** menu item in the left sidebar
- **Posts menu** → you should see an **Ambassadors** menu item

If you see a PHP error on activation, check that your PHP version is 7.4 or higher.

---

## 5. Phase 3 — Install & Configure the Child Theme

### Upload the child theme
1. Upload the `performission-child/` folder from `performission/theme/` to `/wp-content/themes/` via FTP
2. Go to **Appearance → Themes**
3. You should see **PerforMission Child** listed
4. Click **Activate**

> **Important:** Hello Elementor must be installed as the parent theme. If it is not present, the child theme will show an error. Install Hello Elementor first (Appearance → Themes → Add New → search "Hello Elementor").

### Verify the child theme is working
- Front-end should load without errors
- Body tag should have class `pm-logged-in` when you are logged in (check with browser inspector)
- Visit `/ambassadors/` — it should show the ambassador archive template (empty for now)

### Elementor Global Settings
1. Go to **Elementor → Settings → Style**
2. Set the **Default Generic Fonts** to `Inter`
3. Go to **Elementor → Settings → Experiments** → enable any stable experiments you need
4. Go to **Elementor → Site Settings → Global Colors** and add:
   - Accent: `#6c63ff`
   - Background: `#0f1117`
   - Surface: `#1a1e2e`
   - Text: `#eef0f8`

---

## 6. Phase 4 — Zoho CRM Setup

This phase must be completed **before** you connect WordPress to Zoho. All steps happen inside your Zoho CRM account.

### Step 1 — Add custom field to Contacts module

1. Log into Zoho CRM at `crm.zoho.com`
2. Go to **Setup (gear icon) → Customization → Modules and Fields**
3. Click **Contacts**
4. Click **Fields** tab → **+ New Field**
5. Configure the field:
   - **Field Type:** Text
   - **Field Label:** `PM Ambassador WP ID`
   - **API Name:** `PM_Ambassador_WP_ID` ← this exact value is required
   - **Max Length:** 20
   - **Required:** No
6. Save

> This field links each Zoho Contact to a WordPress user ID. It is the security anchor for the ambassador isolation system.

### Step 2 — Create the PM_Monthly_Records custom module

1. Go to **Setup → Customization → Modules and Fields**
2. Click **+ New Module**
3. Set:
   - **Module Name:** `Monthly Records`
   - **API Name:** `PM_Monthly_Records` ← this exact value is required
   - **Singular:** `Monthly Record`
   - **Plural:** `Monthly Records`
4. Save and then add the following fields to the new module:

| Field Label | API Name | Field Type | Required |
|-------------|----------|------------|----------|
| Client | `PM_Client_ID` | Lookup (→ Contacts) | Yes |
| Month | `PM_Month` | Integer | Yes |
| Year | `PM_Year` | Integer | Yes |
| Ad Spend | `PM_Ad_Spend` | Currency | No |
| Client Payment | `PM_Client_Payment` | Currency | No |
| Profit | `PM_Profit` | Currency | No |

> For the `PM_Client_ID` Lookup field: when creating it, set the related module to **Contacts**.

5. Save all fields.

### Step 3 — Set up per-ambassador access in Zoho

For Zoho's own internal security (separate from WordPress):
1. Go to **Setup → Users & Control → Profiles**
2. Create a profile called `Ambassador` with read access to Contacts and PM_Monthly_Records
3. Assign this profile to any Zoho users who are ambassadors

> Note: The WordPress portal does not use Zoho user accounts. It uses the `PM_Ambassador_WP_ID` field to filter contacts by WordPress user ID. Zoho user accounts are only needed if ambassadors will also log into Zoho directly, which is optional.

### Step 4 — Create a Zoho OAuth App

1. Go to **api-console.zoho.com**
2. Click **Add Client → Server-based Applications**
3. Fill in:
   - **Client Name:** `PerforMission WordPress`
   - **Homepage URL:** `https://your-site.com`
   - **Authorized Redirect URIs:** `https://your-site.com/wp-admin/admin.php?page=pm-zoho-settings&pm_zoho_oauth=callback`
     > Replace `your-site.com` with your actual domain.
4. Click **Create**
5. Copy the **Client ID** and **Client Secret** — you will need them in Phase 11.

### Step 5 — Assign ambassadors to contacts in Zoho

For each client Contact in Zoho:
1. Open the Contact record
2. Find the **PM Ambassador WP ID** field
3. Enter the WordPress user ID of the ambassador who owns this client

> To find a WordPress user ID: go to **Users** in WordPress admin, click the ambassador's name — the URL will contain `user_id=XX`. That number is their WP user ID.

---

## 7. Phase 5 — MemberPress (Roles & Login)

### Step 1 — Basic MemberPress setup
1. Go to **MemberPress → Settings → General**
2. Set the **Login Page** to a new page called `/login/` (create it in Phase 7 first, or let MemberPress create it)
3. Set the **Account Page** to a new page called `/account/`
4. Set the **Thank You Page** to `/dashboard/`

### Step 2 — Confirm custom roles exist
The PerforMission Core plugin creates `pm_ambassador` and `pm_client` roles automatically on activation. Verify:
1. Go to **Users → Add New**
2. Check the **Role** dropdown — you should see:
   - `Ambassador` (this is the `pm_ambassador` role)
   - `Client` (this is the `pm_client` role)

If the roles are missing, deactivate and reactivate the **PerforMission Core** plugin.

### Step 3 — Create MemberPress membership levels (optional)
MemberPress memberships are separate from roles. If you want MemberPress to gate content by membership instead of WP roles, create two memberships:
1. **Ambassador Access** — assign the `pm_ambassador` role on signup
2. **Client Access** — assign the `pm_client` role on signup

For most setups, you can skip this and assign roles manually when creating users.

### Step 4 — Protect the dashboard page
1. Go to **MemberPress → Rules → Add New**
2. Set:
   - **Protected Content:** `A Page → Dashboard`
   - **Access Condition:** `Logged in users`
3. Save Rule

### Step 5 — Registration form
MemberPress creates a registration form automatically. To control what role new registrations get:
1. Go to **MemberPress → Settings → Account**
2. Set **New User Role** to `Client` (most new public registrations will be clients)
3. Ambassadors should be created manually by the admin with the Ambassador role assigned.

---

## 8. Phase 6 — LearnDash + WooCommerce (Education)

### WooCommerce quick setup
1. Run the WooCommerce setup wizard (it launches automatically after activation)
2. Set your:
   - Country / currency
   - Payment gateway (Stripe recommended — install the free Stripe plugin)
   - Disable shipping (digital products only)
3. Go to **WooCommerce → Settings → Products → Downloadable Products** → set delivery to `Force downloads`

### LearnDash setup
1. Go to **LearnDash → Settings → General**
2. Under **Course URLs**, set the **Courses Slug** to `education`
3. This makes your course catalog live at `/education/`

### Create your first paid course (example)
1. Go to **LearnDash → Courses → Add New**
2. Set a title, description, and featured image
3. Under **Course Settings → Access Mode**, choose `Buy Now`
4. Set the price — this creates a WooCommerce product automatically
5. Add lessons under the course

### Create a free course/lesson
1. Create a course as above
2. Under **Course Settings → Access Mode**, choose `Free` (or `Open` for public access without login)

### Connect LearnDash to existing WooCommerce products
If you already have WooCommerce products:
1. Edit the course in LearnDash
2. Under **LearnDash → Settings → WooCommerce**, link the product ID

### Student dashboard page
LearnDash creates a shortcode `[ld_profile]` for the student dashboard. You will add this to the portal dashboard page in Phase 7.

---

## 9. Phase 7 — Create All WordPress Pages

Create each page below in **Pages → Add New**. Use the exact slug shown — custom plugins reference these slugs.

### Public pages

| Page Title | Slug | Content / Template |
|------------|------|--------------------|
| Home | `/` (set as front page) | Elementor template — build in Phase 8 |
| Services | `services` | Elementor template |
| Website Developing | `services/website-developing` | Elementor template |
| SEO | `services/seo` | Elementor template |
| AI Video | `services/ai-video` | Elementor template |
| Video Ad Production | `services/video-ad-production` | Elementor template |
| AI Hub | `services/ai-hub` | Elementor template + AI Hub form |
| Managed Campaigns | `services/managed-campaigns` | Elementor template |
| Graphic Design | `services/graphic-design` | Elementor template |
| News | `news` | Set as **Posts page** in Settings → Reading |
| Contact | `contact` | WPForms form + map |
| About | `about` | Elementor template |
| AI KPI Calculator | `kpi-calculator` | Add shortcode `[pm_kpi_calculator]` |
| Education | `education` | LearnDash course archive (auto-created by LearnDash slug setting) |

> For service sub-pages (e.g. `/services/seo/`): create them as **child pages** of the Services page by setting **Page Attributes → Parent** to "Services".

### Portal pages (login-required)

| Page Title | Slug | Content |
|------------|------|---------|
| Dashboard | `dashboard` | Add shortcode: `[pm_dashboard]` |
| Login | `login` | MemberPress login form (auto-created, or add `[mepr-login-form]`) |
| Account | `account` | MemberPress account (add `[mepr-account-form]`) |

### Settings → Reading
1. Go to **Settings → Reading**
2. Set **Your homepage displays** → Static page → select **Home**
3. Set **Posts page** → select **News**

---

## 10. Phase 8 — Elementor Design & Navigation

### Install an agency theme kit (fastest way to get 80% of the design)
1. In Elementor Pro, go to **Templates → Kit Library**
2. Search for a dark/modern agency or marketing kit
3. Import it — this gives you a pre-designed homepage, about page, services pages, and contact page
4. Customise all text, images, and colours to match PerforMission brand

Alternatively, buy a third-party Elementor kit from:
- **Envato Elements** (elementor kits section)
- **TemplateMonster** (Elementor templates)

### Build the homepage sections
The home page should contain these sections (in order):
1. **Hero** — headline, subheadline, two CTAs ("Explore Services" / "Join as Ambassador")
2. **Services overview** — 7 service cards linking to individual service pages
3. **Ecosystem teaser** — brief explanation of the PerforMission model
4. **Ambassador highlights** — 3–4 ambassador cards (link to /ambassadors/)
5. **AI Hub promo** — banner driving to the AI Hub page
6. **Testimonials / results** — client results or stats
7. **CTA section** — "Get Started" driving to /contact/

### Build service page template (reusable)
1. Create one full service page (e.g. Website Developing) in Elementor
2. Save it as a **Template** (bottom bar → Save as Template)
3. For each of the other 6 service pages, load this template and swap the content

### Navigation menu
1. Go to **Appearance → Menus → Create Menu** — name it "Primary"
2. Add pages in this order:
   ```
   Home
   Services (dropdown)
     ├── Website Developing
     ├── SEO
     ├── AI Video
     ├── Video Ad Production
     ├── AI Hub
     ├── Managed Campaigns
     └── Graphic Design
   Ambassadors
   Education
   News
   About
   Contact
   ```
3. Add a **Custom Link** for the portal: URL = `/dashboard/`, Label = "Portal" (show only to logged-in users via Elementor's visibility conditions or a menu visibility plugin)
4. Set this menu as the **Primary** location

### Elementor Theme Builder — Header & Footer
1. Go to **Templates → Theme Builder → Header → Add New**
2. Build your header with logo, navigation menu widget, and a "Login/Account" button
3. Add a **Display Condition**: All Pages
4. Repeat for the Footer

---

## 11. Phase 9 — Configure AI Hub Webhook

### Step 1 — Build the AI Hub signup form
1. Go to **WPForms → Add New** → create a new form
2. Name it `AI Hub Signup`
3. Add fields: **Name** (required), **Email** (required), optionally: Phone, Company
4. Save the form — note the **Form ID** shown in the forms list (e.g. `42`)

### Step 2 — Configure the webhook
1. Go to **PerforMission → AI Hub** in the WordPress admin
2. Fill in:
   - **Platform Webhook URL**: the POST endpoint your external marketing platform provided
   - **Platform API Key**: the API key from your external platform
   - **WPForms ID**: the form ID from Step 1 (e.g. `42`)
3. Save

### Step 3 — Embed the form on the AI Hub page
1. Edit the AI Hub service page in Elementor
2. Add a **WPForms widget** to the page
3. Select the `AI Hub Signup` form
4. Style it to match the page design

### Step 4 — Test the webhook
1. Submit the AI Hub form with a test email address
2. Go to **PerforMission → AI Hub** → scroll to **Recent Webhook Log**
3. You should see a green ✅ entry with your test email
4. Check your external platform to confirm the registration arrived

> If the webhook shows a red ❌: verify the endpoint URL is correct, the API key is valid, and your server can make outbound HTTPS requests.

---

## 12. Phase 10 — Configure KPI Calculator

### Step 1 — Get an AI API key
Choose your provider:
- **OpenAI**: platform.openai.com → API Keys → Create new key
- **Anthropic (Claude)**: console.anthropic.com → API Keys → Create key

### Step 2 — Configure the plugin
1. Go to **PerforMission → KPI Calculator**
2. Fill in:
   - **AI Provider**: OpenAI or Anthropic
   - **AI API Key**: your key from Step 1
   - **Model**:
     - OpenAI: `gpt-4o-mini` (fast and cheap) or `gpt-4o`
     - Anthropic: `claude-haiku-4-5-20251001` (fast) or `claude-sonnet-4-6`
   - **Rate limit**: `10` (requests per IP per hour — prevents abuse)
3. Save

### Step 3 — Embed on the KPI Calculator page
1. Edit the **AI KPI Calculator** page in Elementor
2. Add a **Shortcode widget**
3. Enter: `[pm_kpi_calculator]`
4. Publish

### Step 4 — Test
1. Visit `/kpi-calculator/` on the front-end
2. Enter some test numbers and click "Analyse My KPIs"
3. You should receive an AI-generated analysis within ~5 seconds

---

## 13. Phase 11 — Connect Zoho CRM (OAuth)

This phase assumes you have completed Phase 4 (Zoho CRM Setup) and have your Client ID and Client Secret ready.

### Step 1 — Enter Zoho credentials
1. Go to **PerforMission → Zoho Settings** in WordPress admin
2. Enter your **Zoho Client ID** and **Zoho Client Secret**
3. Click **Save Credentials**

### Step 2 — Authorise with Zoho
1. After saving credentials, click **Connect to Zoho CRM** button
2. You will be redirected to Zoho's OAuth login page
3. Log in with your Zoho admin account
4. Click **Accept** to grant the permissions
5. Zoho redirects you back to the WordPress settings page
6. You should see: ✅ **Connected to Zoho CRM**

### Step 3 — Test the connection
1. On the settings page, click **Test Zoho Connection**
2. You should see ✅ **Connected successfully**

If it fails:
- Verify the redirect URI in your Zoho API Console matches exactly: `https://your-site.com/wp-admin/admin.php?page=pm-zoho-settings&pm_zoho_oauth=callback`
- Check that `WP_DEBUG_LOG` is true and review `/wp-content/debug.log` for `[PM Zoho]` entries

### Step 4 — Test the ambassador dashboard
1. Log in as a test ambassador user
2. Navigate to `/dashboard/`
3. The **My Clients** tab should load and attempt to fetch clients from Zoho
4. If Zoho Contacts exist with `PM_Ambassador_WP_ID` matching this user's WordPress ID, they will appear

### Step 5 — Create a test ambassador account
1. Go to **Users → Add New**
2. Fill in name, email, password
3. Set **Role** to **Ambassador**
4. Note the user ID from the URL after saving (e.g. `user_id=5`)
5. In Zoho, open a test Contact and set `PM_Ambassador_WP_ID` to `5`
6. Log in as this ambassador and verify the client appears in the dashboard

### Step 6 — Link Ambassador profiles to WP users
For each published Ambassador CPT post:
1. Edit the ambassador in **Ambassadors → Edit**
2. In the **Ambassador Details** meta box, fill in **Linked WordPress User ID** with their WP user ID
3. Also fill in their Zoho CRM User ID if available
4. Save

---

## 14. Phase 12 — QA & Security Checklist

Run every test before going live. Tick each box.

### Ambassador data isolation (critical)
- [ ] Log in as **Ambassador A** → clients tab shows only Ambassador A's clients
- [ ] Log in as **Ambassador B** → clients tab shows only Ambassador B's clients (not A's)
- [ ] While logged in as Ambassador A, manually call in browser: `https://your-site.com/wp-json/pm/v1/clients` → returns only A's clients
- [ ] While logged in as Ambassador A, call `https://your-site.com/wp-json/pm/v1/clients/{zoho_id_of_b_client}/records` (with a client belonging to B) → returns **403 Forbidden**
- [ ] While logged out, call `/wp-json/pm/v1/clients` → returns **401 Unauthorized**

### Client permissions
- [ ] Log in as a **Client** user → dashboard shows Courses tab and Profile only (no CRM data)
- [ ] Log in as a Client and try to access `/wp-admin/` → redirected to dashboard
- [ ] Log in as a Client and call `/wp-json/pm/v1/clients` → returns **403 Forbidden**

### Course access
- [ ] Visit a paid course page while logged out → redirected to login/purchase
- [ ] Purchase a course as a test client → course appears in My Courses dashboard
- [ ] Visit a free/open course → accessible without login (if configured as open)

### AI Hub webhook
- [ ] Submit AI Hub form → webhook log shows ✅ entry
- [ ] Check external platform → registration arrived
- [ ] Submit form with invalid email → form validation blocks submission

### KPI Calculator
- [ ] Submit metrics → AI analysis returns within 10 seconds
- [ ] Submit 11 requests from same IP in 1 hour → 11th returns 429 Too Many Requests
- [ ] Inspect browser network tab → no AI API key visible in any request

### Roles & redirects
- [ ] Login as Ambassador → redirected to `/dashboard/`
- [ ] Login as Client → redirected to `/dashboard/`
- [ ] Login as Admin → redirected to `/wp-admin/`
- [ ] Access `/dashboard/` while logged out → redirected to `/login/`

### SEO & performance
- [ ] Rank Math SEO: all public pages have a meta title and description set
- [ ] Google PageSpeed Insights score ≥ 80 on mobile
- [ ] SSL certificate valid (green padlock in browser)

---

## 15. Going Live Checklist

- [ ] Set `WP_DEBUG` to `false` in `wp-config.php`
- [ ] Enable caching plugin (WP Rocket or LiteSpeed Cache)
- [ ] Configure Cloudflare or your hosting CDN
- [ ] Set up automatic daily backups (UpdraftPlus → Google Drive or S3)
- [ ] Complete Wordfence scan with no critical issues
- [ ] Submit sitemap to Google Search Console: `https://your-site.com/sitemap_index.xml`
- [ ] Test all contact forms — ensure email is delivered (use SMTP plugin like WP Mail SMTP)
- [ ] Confirm all 7 service pages are published and linked from the Services hub
- [ ] Confirm Ambassadors archive lists all ambassador profiles
- [ ] Payment gateway: run a test transaction (Stripe test mode) for a paid course
- [ ] Disable Stripe test mode, switch to live keys

---

## 16. Admin Reference Card

Keep this as a quick reference after go-live.

### Daily admin tasks
| Task | Where |
|------|-------|
| Add a new Ambassador profile | Ambassadors → Add New |
| Assign a client to an ambassador | Set `PM_Ambassador_WP_ID` in Zoho Contact record |
| Reassign a client (change ambassador) | PerforMission admin OR Zoho → edit Contact field |
| Add a new course | LearnDash → Courses → Add New |
| View AI Hub webhook logs | PerforMission → AI Hub → Recent Webhook Log |
| Reconnect Zoho if token expires | PerforMission → Zoho Settings → Connect |

### Where things live
| System | Location |
|--------|---------|
| Ambassador public profiles | `/ambassadors/` and individual profile pages |
| Ambassador private dashboard | `/dashboard/` (logged in as Ambassador) |
| Client portal | `/dashboard/` (logged in as Client) |
| Course catalog | `/education/` |
| KPI Calculator | `/kpi-calculator/` |
| AI Hub signup | `/services/ai-hub/` |
| Admin: Zoho settings | WP Admin → PerforMission → Zoho Settings |
| Admin: AI Hub settings | WP Admin → PerforMission → AI Hub |
| Admin: KPI Calculator | WP Admin → PerforMission → KPI Calculator |

### Shortcode reference
| Shortcode | Use |
|-----------|-----|
| `[pm_dashboard]` | Role-aware portal dashboard (place on /dashboard/ page) |
| `[pm_kpi_calculator]` | KPI Calculator widget |
| `[mepr-login-form]` | MemberPress login form |
| `[mepr-account-form]` | MemberPress account page |
| `[ld_profile]` | LearnDash student profile / progress |

### Custom plugin files — where to edit
| What you want to change | File |
|------------------------|------|
| Ambassador CPT fields | `performission-core/includes/class-ambassador-cpt.php` |
| Role permissions | `performission-core/includes/class-roles.php` |
| Dashboard HTML layout | `performission-core/includes/class-portal-dashboard.php` |
| Zoho API field names | `performission-zoho/includes/class-zoho-api.php` |
| REST API endpoints | `performission-zoho/includes/class-zoho-rest-api.php` |
| Dashboard JavaScript | `performission-zoho/assets/js/dashboard.js` |
| Portal CSS | `performission-core/assets/css/portal.css` |
| Ambassador page template | `theme/performission-child/templates/single-ambassador.php` |
| Ambassador archive template | `theme/performission-child/templates/archive-ambassador.php` |

---

*End of Setup Guide — PerforMission v1.0*
