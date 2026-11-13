# Sudd Shop: how to run it

## What's new in version 2

**Store:** logo and search bar in the header, an Offers page, homepage sections for categories, featured products,
deals, new arrivals and best sellers, plus a footer with contact details and payment methods.
The shop has filters (category, product type, size, price, rating, in stock, on sale), sorting and pages.
Products show sale prices, stock left ("Only 3 left"), and real ratings and reviews.

**Cart and checkout:** quantities are limited to the stock available, and prices are re-checked every time the cart opens.
Customers pick a county and the delivery fee is calculated from it (free over KSh 10,000).
Checkout also has billing details (company name and KRA PIN optional), saved addresses, and three payment options:
**M-Pesa (STK push)**, **card (Paystack)** and **cash on delivery**. A payment page waits for the M-Pesa
confirmation, lets the customer retry or switch to card, and shows the receipt.

**Customer account:** profile, change password (signs out other devices), saved delivery addresses,
order history, and order tracking with a timeline, courier and tracking number. Customers can cancel orders that haven't been paid.

**Admin dashboard:** overview (today's sales, orders to fulfil, low stock), products (add, edit, hide, delete,
sale prices, featured), stock updates, categories, orders (status changes, delivery tracking, mark paid or refunded,
CSV export), customers (view orders and addresses, block, make admin), review moderation, and sales reports
(revenue chart, top products, payment methods, categories, counties, CSV export).

**Stock is safe:** an order takes its items out of stock straight away and puts them back if it is cancelled.
Unpaid M-Pesa and card orders are cancelled automatically after 2 hours.

### Admin sign-in

`npm run setup` creates an admin account and writes the login to `server/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
Sign in with those details, change the password under **My account → Password**, then open **Admin dashboard**
from the account menu.

### Payments: test mode and going live

Until you add keys, M-Pesa and card payments run in **test mode**: no money moves, and the payment page shows
buttons to simulate success or failure. (Test mode is switched off automatically when `NODE_ENV=production`.)

- **M-Pesa:** create an app at https://developer.safaricom.co.ke and add "M-Pesa Express". In `server/.env`, set
  `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE` and `MPESA_PASSKEY`. Use `MPESA_ENV=sandbox`
  to test (shortcode 174379), and `production` with your own Paybill or Till.
  For a Till, set `MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline` and `MPESA_PARTY_B` to the till number.
  Payments are confirmed by asking Safaricom directly, so this works on your own PC too. On a live server, also set
  `MPESA_CALLBACK_URL` (it must be a public `https://` address) so confirmations arrive instantly.
- **Cards:** create a Paystack account (Kenya), then put your secret key in `PAYSTACK_SECRET_KEY`
  (`sk_test_…` to test, `sk_live_…` to go live). In the Paystack dashboard, set the webhook to
  `https://YOUR-API/api/v1/payments/paystack/webhook`.

### Store details

Change the shop's name, phone, WhatsApp, email, address and social links in `client/src/config/store.js`.
Change delivery fees and zones in `server/src/config/store.js`.

### Product images

If `IMAGEKIT_PRIVATE_KEY` is set, images go to ImageKit. If not, they are saved in `server/uploads`, so adding products works with no setup.
On a live server, set `API_PUBLIC_URL` to the API's public address so image links point to it.

---

## Step 1. Install Node.js (once per PC)

1. Go to https://nodejs.org and download the **LTS** version.
2. Install it (click Next through the installer).
3. Restart the PC, or at least close and reopen VS Code and terminals.

Check it: open a terminal and type `node -v`. It must show **v20.19** or higher.

## Step 2. Unzip in a normal folder

1. Save the zip to the **Desktop** (not inside the WhatsApp or Downloads temp folders).
2. Right-click → **Extract All** → Extract.
3. Open the extracted folder until you see **`start.bat`**, `README.md`, `client` and `server`. This is the **project folder**.

## Step 3. Start it

**Option A (easiest):** double-click **`start.bat`** in the project folder.

**Option B (VS Code):** open the **project folder** in VS Code (File → Open Folder), open a terminal (Terminal → New Terminal), and run:

```
npm run setup
npm run dev
```

`npm run setup` is only needed the first time.

## Step 4. Wait, then open the store

The **first time** it downloads the database (about 780 MB), so it can take **5–15 minutes**. Keep the window open.

It is ready when you see:

```
Step 2/2: API server is ready at http://localhost:8000. Starting the store...
[client]   ➜  Local:   http://localhost:5173/
```

Open the address shown on the `Local:` line in your browser (usually **http://localhost:5173**).

## Step 5. Create an account

Each PC has its **own empty database**, so accounts from another PC don't exist here.
On the login page click **"Create account"** first, then sign in with it.

## To stop / start again

- Stop: press `Ctrl+C` in the terminal (or close the window).
- Start again later: double-click `start.bat`, or run `npm run dev`. It starts in seconds after the first time.

---

## If something goes wrong

| What you see | What to do |
| --- | --- |
| `'node' is not recognized` | Node.js isn't installed. Do Step 1, then restart. |
| `npm error enoent Could not read package.json` | You're in the wrong folder. Open the folder that contains `start.bat` (Step 2). |
| `This project needs Node.js 20.19 or newer` | Update Node.js (Step 1). |
| `The project is not set up yet` | Run `npm run setup`. |
| `Port 8000 is already in use` | Another program uses port 8000. Close it, or set `PORT=8001` in `server/.env` and `VITE_API_URL=http://localhost:8001/api/v1` in `client/.env`. |
| `Could not start the local MongoDB database` | Check the internet, then install the **Microsoft Visual C++ Redistributable (x64)** from Microsoft and run again. Or use a free MongoDB Atlas database: paste its connection string after `MONGODB_URI=` in `server/.env`. |
| Website says *"Can't reach the server"* | The terminal is closed or still starting. Wait for "API server is ready", then refresh. |
| Login says *"Invalid email or password"* | Click **"Create account"** first (Step 5). |

## Extra settings (optional)

- **Product images:** optional ImageKit key in `IMAGEKIT_PRIVATE_KEY`; without it images are saved in `server/uploads`.
- **Admin account:** the first admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`. To make another admin, use **Admin → Customers → Make admin**.
