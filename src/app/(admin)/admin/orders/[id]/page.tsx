// TODO: implement
import React from 'react';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>Order detail and status update for ID: {id}</div>;
}
