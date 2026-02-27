import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { key, value } = data;

    const updatedConfig = await prisma.appConfig.update({
      where: { key },
      data: { value }
    });

    return NextResponse.json(updatedConfig);
  } catch (error: any) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}
