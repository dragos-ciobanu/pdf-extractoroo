# pdf-extractoroo

A simple application where users can upload PDF files and extract text content. Built using NestJS, React, PostgreSQL, RabbitMQ, and MinIO.

## What This Project Does

pdf-extractoroo is a full-stack web application that allows users to:
- Upload PDF files through a web interface
- Submit extraction tasks to a distributed job queue
- Extract text content from PDFs (currently supports text-based PDFs)
- Track the status of extraction tasks
- View extracted text content

The application uses a **microservices architecture** with three main components:
- **API**: NestJS-based REST API with authentication
- **Web**: React-based frontend for user interaction
- **Worker**: Background job processor for PDF text extraction

## Prerequisites

Before running the application, ensure you have the following installed:

- **Docker**: v20.10 or higher
- **Docker Compose**: v2.0 or higher
- **Make**: Optional, but recommended for convenience commands
- **Git**: For cloning the repository

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pdf-extractoroo
cp .env.example .env
```

### 2. Bootstrap the Application

The simplest way to get everything running is to use the bootstrap command:

```bash
make bootstrap
```

This command will:
1. Start all Docker containers (PostgreSQL, RabbitMQ, MinIO, API, Worker, Web)
2. Run database migrations
3. Seed initial data

Alternatively, if you don't have `make` installed:
```bash
docker compose up --build -d
docker compose exec api npm run prisma:migrate
docker compose exec api npm run prisma:seed
```

### 3. Access the Application

Once the services are running:

- **Web UI**: [http://localhost:5173](http://localhost:5173)
- **API**: [http://localhost:3000](http://localhost:3000)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (credentials: minio/minio123456)
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (credentials: guest/guest)

## Usage

### Starting the Application

```bash
# Start all services
make up

# Restart services
make restart

# Stop all services
make down

# View logs
make logs
```

### Upload and Extract PDF

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Log in with your credentials
3. Select a PDF file and click upload
4. Submit the extraction request
5. The worker process will extract text from the PDF
6. View or download the extracted text

### Database Management

```bash
# Run database migrations
make db-migrate

# Seed the database with initial data
make db-seed

# Generate Prisma client
make db-generate
```

### Cleanup

```bash
# Stop and remove all containers
make down

# Stop, remove containers, and delete volumes (clean slate)
make clean
```

## Project Structure

```
pdf-extractoroo/
├── apps/
│   ├── api/          # NestJS REST API
│   ├── web/          # React frontend
│   └── worker/       # Background job processor
├── docker-compose.yml # Service orchestration
└── Makefile          # Convenient commands
```

## Technology Stack

- **Backend**: NestJS, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Database**: PostgreSQL 18
- **Message Queue**: RabbitMQ 4.2
- **Object Storage**: MinIO (S3-compatible)
- **Authentication**: JWT
- **ORM**: Prisma

## Limitations

⚠️ **Important Limitations:**

1. **No OCR Support**: The application currently **does not support OCR (Optical Character Recognition)**. This means:
   - Only text-based PDFs can be processed
   - Scanned images or image-based PDFs will not have their content extracted

2. **Single Text Extraction**: Currently extracts raw text without advanced formatting preservation

## Environment Configuration

You can customize the application behavior by setting environment variables. Common configurations:

```bash
# API
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key

# Database
POSTGRES_DB=pdftext
POSTGRES_USER=pdftext
POSTGRES_PASSWORD=pdftext
POSTGRES_PORT=5432

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_PORT=5672

# MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123456
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
S3_BUCKET=pdfs

# Frontend
VITE_API_BASE_URL=http://localhost:3000
WEB_PORT=5173
```
