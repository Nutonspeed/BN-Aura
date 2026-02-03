// OpenAPI Documentation Generator for BN-Aura
// Generate comprehensive API documentation

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    securitySchemes: Record<string, any>;
    schemas: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

const generateOpenAPISpec = async (): Promise<OpenAPISpec> => {
  const adminClient = createAdminClient();
  
  // Get database schema information
  const { data: tables } = await adminClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');

  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'BN-Aura API',
      description: 'Premium Aesthetic Intelligence Platform API Documentation',
      version: '1.0.0',
      contact: {
        name: 'BN-Aura Support',
        email: 'support@bnaura.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.bnaura.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production Server' 
          : 'Development Server'
      }
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from Supabase authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'clinic_owner', 'clinic_admin', 'beautician', 'clinic_staff', 'premium_customer', 'free_customer'],
              description: 'User role in the system'
            },
            clinic_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated clinic ID (if applicable)'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'email', 'role', 'is_active']
        },
        Clinic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique clinic identifier'
            },
            clinic_code: {
              type: 'string',
              description: 'Unique clinic code'
            },
            display_name: {
              type: 'object',
              properties: {
                en: { type: 'string', description: 'English name' },
                th: { type: 'string', description: 'Thai name' }
              },
              description: 'Clinic display name in multiple languages'
            },
            subscription_tier: {
              type: 'string',
              enum: ['free', 'professional', 'enterprise'],
              description: 'Subscription tier'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the clinic is active'
            },
            owner_user_id: {
              type: 'string',
              format: 'uuid',
              description: 'Clinic owner user ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Clinic creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'clinic_code', 'display_name', 'subscription_tier', 'is_active']
        },
        APIResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the operation was successful'
            },
            data: {
              type: 'object',
              description: 'Response data (if successful)'
            },
            error: {
              type: 'string',
              description: 'Error message (if unsuccessful)'
            },
            message: {
              type: 'string',
              description: 'Additional information message'
            }
          },
          required: ['success']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error description'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          },
          required: ['success', 'error']
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Clinics',
        description: 'Clinic management operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Admin',
        description: 'Super admin operations'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting'
      },
      {
        name: 'Security',
        description: 'Security and audit operations'
      }
    ]
  };

  // Add API paths
  spec.paths = {
    // Authentication endpoints
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'User email'
                  },
                  password: {
                    type: 'string',
                    description: 'User password'
                  }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },

    // Admin management endpoints
    '/api/admin/management': {
      get: {
        tags: ['Admin'],
        summary: 'Get system management data',
        description: 'Retrieve clinics, users, and system statistics (Super Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['stats', 'clinics', 'clinic']
            },
            description: 'Type of data to retrieve'
          },
          {
            name: 'id',
            in: 'query',
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Clinic ID (required when type=clinic)'
          }
        ],
        responses: {
          '200': {
            description: 'Data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '403': {
            description: 'Forbidden - Super Admin access required',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Admin'],
        summary: 'Perform admin operations',
        description: 'Create, update, or manage clinics and users (Super Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    enum: ['createClinic', 'updateClinic', 'updateStatus', 'updateQuota'],
                    description: 'Admin action to perform'
                  },
                  clinicId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Clinic ID (for update operations)'
                  },
                  clinicData: {
                    type: 'object',
                    description: 'Clinic data (for create/update operations)'
                  },
                  status: {
                    type: 'string',
                    enum: ['active', 'inactive'],
                    description: 'Clinic status (for updateStatus operation)'
                  }
                },
                required: ['action']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Operation completed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },

    // Support tickets endpoints
    '/api/admin/support/tickets': {
      get: {
        tags: ['Admin'],
        summary: 'Get support tickets',
        description: 'Retrieve support tickets with filtering and pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
              default: 1
            },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 20
            },
            description: 'Items per page'
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed']
            },
            description: 'Filter by status'
          },
          {
            name: 'priority',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent']
            },
            description: 'Filter by priority'
          }
        ],
        responses: {
          '200': {
            description: 'Tickets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          }
        }
      }
    },

    // Security endpoints
    '/api/admin/security': {
      get: {
        tags: ['Security'],
        summary: 'Get security metrics',
        description: 'Retrieve security analytics and metrics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['metrics', 'events', 'alerts']
            },
            description: 'Type of security data'
          },
          {
            name: 'timeRange',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d']
            },
            description: 'Time range for data'
          }
        ],
        responses: {
          '200': {
            description: 'Security data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          }
        }
      }
    },

    // Audit trail endpoints
    '/api/admin/audit': {
      get: {
        tags: ['Security'],
        summary: 'Get audit logs',
        description: 'Retrieve system audit logs and activity history',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['logs', 'stats']
            },
            description: 'Type of audit data'
          },
          {
            name: 'timeRange',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', 'all']
            },
            description: 'Time range for logs'
          }
        ],
        responses: {
          '200': {
            description: 'Audit data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          }
        }
      }
    }
  };

  return spec;
};

export async function GET(request: NextRequest) {
  try {
    const spec = await generateOpenAPISpec();
    
    return Response.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    
    return Response.json(
      {
        success: false,
        error: 'Failed to generate API documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
