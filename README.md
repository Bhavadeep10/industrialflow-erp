# IndustrialFlow ERP

IndustrialFlow ERP is a full stack web application developed to manage customer enquiries, quotations, sales orders, inventory and dispatch operations.

The main aim of this project is to connect the sales process with inventory management in a single application.

## Project Workflow

The application follows this workflow:

Customer Enquiry

Quotation

Sales Order

Inventory Reservation

Dispatch

Inventory Update

## Technologies Used

Frontend:
React.js
Vite
JavaScript
Axios
CSS

Backend:
Node.js
Express.js
TypeScript

Database:
PostgreSQL
Prisma ORM

Authentication:
JWT
bcrypt

## Main Features

1. User Login

Users can log in using their email and password. JWT is used for authentication.

2. Customer Management

Users can add and view customer details such as company name, contact person, mobile number, email and city.

3. Enquiry Management

Users can create enquiries by selecting customers, products and required quantities.

4. Quotation Management

Quotations are created from customer enquiries. The system calculates the quotation amount using product price, quantity, discount and GST.

5. Sales Order Management

An accepted quotation can be converted into a sales order. The system prevents creating more than one sales order from the same quotation.

6. Inventory Management

The inventory section displays physical quantity, reserved quantity and available quantity.

Available Quantity = Physical Quantity - Reserved Quantity

7. Inventory Reservation

Inventory can be reserved only for a confirmed sales order. The backend checks available stock before making the reservation.

Database transactions and row locking are used while updating inventory.

8. Dispatch Management

A dispatch can be created for a confirmed sales order. After dispatch, the inventory quantities are updated and the sales order status changes to DISPATCHED.

## User Roles

The project has two user roles.

Admin

The admin can access administrative operations.

Sales User

The sales user can work with customers, enquiries, quotations, sales orders, inventory and dispatch operations based on the permissions provided by the system.

## Database

The project uses PostgreSQL with Prisma ORM.

Main database tables include:

User
Customer
Product
Inventory
Enquiry
EnquiryItem
Quotation
QuotationItem
SalesOrder
SalesOrderItem
Dispatch
DispatchItem

## API

The backend provides REST APIs for the main modules.

Authentication:

POST /api/auth/login

Customers:

POST /api/customers
GET /api/customers
GET /api/customers/:id
PUT /api/customers/:id

Enquiries:

POST /api/enquiries
GET /api/enquiries
GET /api/enquiries/:id
PATCH /api/enquiries/:id/status

Quotations:

POST /api/quotations
GET /api/quotations
GET /api/quotations/:id
PATCH /api/quotations/:id/status

Sales Orders:

POST /api/sales-orders
GET /api/sales-orders
GET /api/sales-orders/:id
PATCH /api/sales-orders/:id/status

Inventory:

GET /api/inventory
GET /api/inventory/product/:productId
POST /api/inventory/reserve

Dispatches:

POST /api/dispatches
GET /api/dispatches
GET /api/dispatches/:id

## Project Setup

First, create the PostgreSQL database named:

industrialflow_db

Backend setup:

cd industrialflow-backend

npm install

Create a .env file and add the database connection details.

PORT=5001

Run the database migration:

npx prisma migrate dev

Run the seed file:

npm run seed

Start the backend:

npm run dev

The backend runs on:

http://localhost:5001

Frontend setup:

cd industrialflow-frontend

npm install

npm run dev

The frontend runs on:

http://localhost:5175

## Testing

The main features were tested during development.

Login was tested successfully.

Customer creation was tested.

Enquiry creation was tested.

Quotation creation and calculation were tested.

Sales order creation was tested.

Duplicate sales order prevention was tested.

Inventory availability was checked.

Insufficient stock handling was tested.

Inventory reservation was tested.

Dispatch creation was tested.

Inventory update after dispatch was checked.

Role based access was tested.

Both backend and frontend production builds were also tested successfully.

## GitHub Repository

https://github.com/Bhavadeep10/industrialflow-erp

## Author
Bhavadeep