# QR Code Hub

A comprehensive hotel/property management system for QR code-based food and service ordering.

## Features

- **QR Code Generation**: Generate unique QR codes for each unit that link to a digital menu.
- **Unit Management**: Track and manage units and buildings, including QR code assignment.
- **Menu Management**: Create and manage menu items with categories, prices, and availability.
- **Service Management**: Manage services offered with durations, prices, and categories.
- **Order Processing**: Accept and process orders from guests via QR code scans.
- **Mobile-Friendly Interface**: Responsive design for both admin and guest-facing pages.

## System Architecture

The application is built with:

- **Next.js**: React framework for server and client-side rendering
- **Supabase**: Backend database and authentication
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TypeScript**: Type-safe JavaScript for better development experience

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/myqrcode-hub.git
   cd myqrcode-hub
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (create a `.env.local` file)
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

Run the SQL scripts in the following order to set up your Supabase database:

1. `buildings_schema.sql`
2. `units_schema.sql`
3. `menu_items_schema.sql`
4. `services_schema.sql`
5. `orders_schema.sql`
6. `order_items_schema.sql`

## Usage Flow

### Admin Flow

1. **Login**: Administrators log in to the dashboard
2. **Unit Management**: 
   - Create buildings and units
   - Generate and assign QR codes to units
3. **Menu & Services Management**:
   - Create and categorize menu items 
   - Set up services with pricing and durations
4. **Order Management**:
   - View incoming orders from guests
   - Update order status (received, in-progress, completed)

### Guest Flow

1. **Scan QR Code**: Guest scans the QR code in their unit
2. **Browse Menu/Services**: View available food, drinks, and services
3. **Place Order**: Select items, add to cart, and submit order
4. **Confirmation**: Receive order confirmation

## QR Code Implementation

The system uses the following approach for QR codes:

1. **Generation**: QR codes are generated for each unit containing a URL with the unit ID
2. **Storage**: QR codes are stored in Supabase storage and linked to unit records
3. **Scanning**: When scanned, the QR code directs to the order page with the unit ID

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
