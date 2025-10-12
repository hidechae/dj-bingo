import type { NextApiRequest, NextApiResponse } from "next";
import { getProviders } from "next-auth/react";
import { authOptions } from "~/server/auth";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("🔍 AUTH DEBUG API CALLED");
    
    // Get environment info (without exposing secrets)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    };

    // Get configured providers
    const providers = await getProviders();
    const providerInfo = providers ? Object.keys(providers).map(id => ({
      id,
      name: providers[id]?.name,
      type: providers[id]?.type,
    })) : null;

    // Get authOptions providers directly
    const configuredProviders = authOptions.providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
    }));

    // Test database connectivity
    let dbConnected = false;
    let dbError = null;
    try {
      // Simple query to test DB connectivity
      await db.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Unknown DB error";
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      providersFromGetProviders: providerInfo,
      providersFromAuthOptions: configuredProviders,
      totalProvidersLoaded: providerInfo?.length || 0,
      totalProvidersConfigured: configuredProviders.length,
      hasCredentialsProvider: providerInfo?.some(p => p.id === 'credentials') || false,
      hasGoogleProvider: providerInfo?.some(p => p.id === 'google') || false,
      hasCredentialsProviderConfigured: configuredProviders.some(p => p.id === 'credentials'),
      hasGoogleProviderConfigured: configuredProviders.some(p => p.id === 'google'),
      databaseConnected: dbConnected,
      databaseError: dbError,
      providerMismatch: (providerInfo?.length || 0) !== configuredProviders.length,
    };

    console.log("📊 DEBUG INFO:", JSON.stringify(debugInfo, null, 2));

    return res.status(200).json({
      success: true,
      debug: debugInfo,
      message: "Check server logs for detailed information"
    });

  } catch (error) {
    console.error("❌ Debug API error:", error);
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Check server logs for error details"
    });
  }
}