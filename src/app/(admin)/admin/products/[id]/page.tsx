// TODO: implement
import React from 'react';

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>Edit existing product: {id}</div>;
}
