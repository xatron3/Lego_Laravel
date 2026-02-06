# BrickOasis

**BrickOasis** is a comprehensive platform for LEGO enthusiasts, providing tools for viewing 3D LDraw models, browsing an extensive catalog of LEGO sets and parts, buying/selling custom MOCs (My Own Creations), and tracking LEGO investments.

## Features

### 🧱 3D Model Viewer

- Interactive 3D rendering of LDraw LEGO models using Three.js
- Step-by-step building instructions
- Upload and share your own creations

### 🛒 MOC Marketplace

- Buy and sell custom LEGO designs
- Secure payments via Stripe
- Creator monetization with 95% revenue share

### 📊 LEGO Catalog

- Comprehensive database of sets, parts, minifigures, and themes
- Powered by Rebrickable data
- Advanced search and filtering

### 💰 Flipping Tracker

- Track LEGO purchases and sales
- Automatic profit calculation
- Portfolio analytics

### 👥 Community Features

- Follow other builders
- Comment and like MOCs
- Share your creations

## Technology Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS 4
- **3D Rendering**: Three.js with @react-three/fiber and LDrawLoader
- **Database**: SQLite (default)
- **Authentication**: Laravel Sanctum + Google OAuth
- **Payments**: Stripe
- **Data**: Rebrickable API

## Legal & Trademark Notice

LEGO® is a trademark of the LEGO Group of companies which does not sponsor, authorize, or endorse this site. BrickOasis is an independent, fan-created platform that follows the [LEGO Fair Play guidelines](https://www.lego.com/legal/notices-and-policies/fair-play).

## Setup

```bash
# Install dependencies and setup database
composer setup

# Start development server with all services
composer dev

# Run tests
composer test
```

## Credits

BrickOasis is built with:

- [LDraw.org](https://ldraw.org) - Open standard for LEGO CAD programs
- [Rebrickable](https://rebrickable.com) - LEGO database
- [Three.js](https://threejs.org) - 3D rendering
- [Laravel](https://laravel.com) & [React](https://react.dev) - Application frameworks

## License

BrickOasis is open-source software. All LEGO-related trademarks and copyrights remain the property of the LEGO Group.

For questions or support, visit our [About](/about) or [Contact](/contact) pages.
