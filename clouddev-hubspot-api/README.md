# HubSpot API Services Documentation

This repository contains two services that interact with the HubSpot API: **`optimized-worker-service`** and **`current-worker-service`**. Both services are designed to facilitate integration with HubSpot's API for various tasks and operations, with distinct differences in their implementation and features.

---

## **Overview**

### **`optimized-worker-service`**
The **`optimized-worker-service`** is a modern, TypeScript-based implementation designed with scalability, maintainability, and type safety in mind. It leverages a clean architecture and includes cron job functionality for scheduled tasks.

### **`current-worker-service`**
The **`current-worker-service`** is a legacy implementation written in JavaScript. It provides foundational HubSpot API integration features for tasks such as basic data synchronization and lead management.

---

## **`optimized-worker-service`**

### **Key Features**
- **Real-time HubSpot Data Synchronization**: Synchronize meetings, contacts, and other data with the HubSpot API.
- **TypeScript for Type Safety**: Ensures better maintainability and reduces runtime errors.
- **Cron Job Implementation**: Handles periodic tasks with ease.
- **Scalable Architecture**: Modularized for high-performance processing.
- **Customizable Workflows**: Extensible logic for various business processes.

### **Folder Structure**
The folder structure for `optimized-worker-service` is organized as follows:

/optimized-worker-service
|-- /src
|   |-- /config # Application and database configurations
|   |-- /jobs # Job definitions and cron tasks
|   |-- /models # MongoDB schemas (e.g., Domain, Meeting)
|   |-- /services # Business logic and HubSpot API interactions
|   |-- /utils # Shared utilities (e.g., queue, date handlers)
|   |-- /types # TypeScript type definitions
|   |-- app.ts # Main entry point for the worker
|   |-- tsconfig.json # TypeScript configuration
|-- package.json # Project metadata and dependencies


---

## **`current-worker-service`**

### **Key Features**
- **Basic HubSpot Data Synchronization**: Supports foundational tasks like fetching and processing meetings or contacts.
- **JavaScript-Based Implementation**: Easier to prototype and modify for simpler workflows.
- **Streamlined Workflow Automation**: Minimal logic for automating basic processes.


## **Environment Variables**

Both services use environment variables defined in a `.env` file. Ensure the following variables are properly set:

| Variable         | Description                                         |
|------------------|-----------------------------------------------------|
| `NODE_ENV`       | Specifies the environment (`development`, `production`). |
| `HUBSPOT_CID`    | HubSpot API Client ID.                              |
| `HUBSPOT_CS`     | HubSpot API Client Secret.                          |
| `MONGO_URI`      | MongoDB connection string.                          |
| `PORT`           | Port for the service (used primarily in `optimized-worker-service`). |

---

## **Running the Services**

### **Current Worker Service**
Navigate to the `current-worker-service` directory and run:
```bash
npm run dev



This starts the service using nodemon for automatic reloads during development.

### **New Worker Service**
Navigate to the `optimized-worker-service` directory and run:
```bash
npm run start
```
This starts the service in production mode after compiling TypeScript to JavaScript. For development mode, use:
```bash
npm run dev
```

This will output a message indicating no tests are specified. Test suite expansion is planned for future development.

### **Contributing**
Contributions to both services are welcome! To contribute:

1. Fork the repository.
2. Make changes in a feature branch.
3. Submit a pull request with clear documentation.
4. Ensure all code adheres to the repository’s coding standards and includes relevant comments or documentation.
