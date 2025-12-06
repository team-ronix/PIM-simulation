# PIM Simulator

A Protocol Independent Multicast (PIM) routing simulator built with React and Vite.

## About PIM Protocol

Protocol Independent Multicast (PIM) is a family of multicast routing protocols that efficiently distribute data from one source to multiple receivers across a network. Unlike unicast (one-to-one) or broadcast (one-to-all), multicast enables one-to-many communication, optimizing bandwidth usage.

### PIM Modes

This simulator supports two main PIM modes:

#### PIM-SM (Sparse Mode)
- **Best for**: Networks where receivers are sparsely distributed
- **Method**: Uses a Rendezvous Point (RP) as a central meeting point
- **Operation**: 
  - Receivers send Join messages toward the RP
  - Sources register with the RP
  - Shortest Path Tree (SPT) can be established for optimized delivery
- **Advantage**: Reduces unnecessary traffic by only sending data where explicitly requested

#### PIM-DM (Dense Mode)
- **Best for**: Networks where receivers are densely distributed
- **Method**: Flood-and-prune approach
- **Operation**:
  - Initially floods multicast traffic to all routers
  - Routers without interested receivers send Prune messages
  - Creates a distribution tree by eliminating unnecessary branches
- **Advantage**: Simple and efficient when most subnets have active receivers

### Key Concepts
- **Multicast Group**: A logical group identified by an IP address that receivers join to receive data
- **Distribution Tree**: The path through which multicast traffic flows from source to receivers
- **Rendezvous Point (RP)**: A router that acts as a meeting point in PIM-SM
- **RPF (Reverse Path Forwarding)**: Mechanism to prevent loops by checking if packets arrive on the expected interface

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your system.

### Installation

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm install`

Install all dependencies before first run.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Features

- **Interactive Visualization**: Watch PIM protocols in action with animated packet flow
- **Dual Protocol Support**: Switch between PIM-SM and PIM-DM modes
- **Network Topology**: Visualize source, routers, receivers, and their connections
- **Real-time Logs**: Track protocol operations and state changes
- **Receiver Management**: Toggle receivers on/off to see protocol adaptation

## Project Structure

```
pim-simulator/
├── public/          # Static assets
├── src/             # Source files
│   ├── App.jsx      # Main application component
│   ├── App.css      # Application styles
│   └── index.jsx    # Entry point
├── vite.config.mjs  # Vite configuration
└── package.json     # Project dependencies
```

## Technology Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework

## Deployment

This project is configured to deploy to GitHub Pages. The homepage is set to:
`https://team-ronix.github.io/pim-simulator`

To deploy:
```bash
npm run build
npm run deploy
```
