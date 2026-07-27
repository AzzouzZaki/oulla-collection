// TODO: implement
import React from 'react';

export default function Modal({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  if (!isOpen) return null;
  return <div>{children}</div>;
}
