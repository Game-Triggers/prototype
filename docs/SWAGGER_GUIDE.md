# Swagger Documentation Guide for Gametriggers API

This guide explains how to use and extend the Swagger documentation for the Gametriggers API.

## Accessing the Swagger UI

The Swagger UI is available at:

```
http://localhost:3001/api/docs
```

When the NestJS backend is running, you can access this URL in your browser to see the interactive API documentation.

## Swagger Decorators

We use the following decorators from `@nestjs/swagger` to document the API:

### Controller-Level Decorators

- `@ApiTags(tag)` - Groups endpoints by feature or module
- `@ApiBearerAuth()` - Indicates endpoints that require authentication

### Method-Level Decorators

- `@ApiOperation({ summary, description })` - Provides a summary and detailed description of the endpoint
- `@ApiResponse({ status, description, type })` - Documents possible responses, including success and error cases
- `@ApiParam({ name, type, description })` - Documents path parameters
- `@ApiQuery({ name, type, description })` - Documents query parameters
- `@ApiBody({ type })` - Documents request body schema

### Property-Level Decorators

- `@ApiProperty()` - Documents required properties of DTOs
- `@ApiPropertyOptional()` - Documents optional properties of DTOs

## Example Usage

```typescript
// Controller example
@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiResponse({ status: 200, description: 'List of all campaigns' })
  async findAll() {
    // implementation
  }
}

// DTO example
export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign title' })
  @IsString()
  title: string;
  
  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

## Adding Documentation to New Endpoints

When adding new endpoints or DTOs:

1. Import the necessary decorators from `@nestjs/swagger`
2. Add `@ApiTags` to controllers
3. Add `@ApiOperation` to describe each endpoint
4. Use `@ApiResponse` to document possible responses
5. Use `@ApiProperty` for DTO properties
6. For auth protected routes, add `@ApiBearerAuth()`

## Schemas and Models

Swagger automatically generates schema definitions from your DTOs, but you can enhance them with descriptive decorators. Use enum descriptions, examples, and other metadata to make the API documentation more helpful.

## Authentication

The API uses Bearer Token authentication. In the Swagger UI:

1. Click the "Authorize" button
2. Enter your JWT token in the format: `Bearer your_token_here`
3. Click "Authorize" to apply the token to all secured endpoints

## Best Practices

- Always document the success and error responses
- Provide examples for complex schemas
- Use consistent naming conventions
- Keep descriptions clear and concise
- Update the documentation when changing the API
