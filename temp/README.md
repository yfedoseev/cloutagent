# Langflow Docker Setup (Temporary)

This directory contains a temporary Docker setup for running Langflow.

## What is Langflow?

Langflow is an open-source UI for LangChain, designed to create AI flows visually with drag-and-drop components.

## Quick Start

### Start Langflow

```bash
cd temp
docker-compose up -d
```

### Access Langflow

Once running, access Langflow at:
- **URL:** http://localhost:7860
- **Auto-login:** Enabled (no authentication required)

### View Logs

```bash
docker-compose logs -f langflow
```

### Stop Langflow

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

## Services

- **Langflow:** Port 7860 (main UI)
- **PostgreSQL:** Internal database for storing flows

## Volumes

- `langflow_data`: Stores Langflow configuration and flows
- `postgres_data`: PostgreSQL database storage

## Environment Variables

Default configuration in docker-compose.yml:
- Database: PostgreSQL
- Auto-login: Enabled
- Port: 7860

## Troubleshooting

### Check container status
```bash
docker-compose ps
```

### View all logs
```bash
docker-compose logs
```

### Restart services
```bash
docker-compose restart
```

### Clean restart
```bash
docker-compose down
docker-compose up -d
```

## Cleanup

When you're done testing, remove everything:

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Go back to project root
cd ..

# Remove temp directory
rm -rf temp
```

## Notes

- This is a temporary setup for testing/exploration
- All configuration is self-contained in the temp directory
- No changes made to the main project
- Safe to delete the entire temp directory when done
