import { DisputeStatus } from '@prisma/client';

export interface IDispute {
  id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
  reporterId: string;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateDispute {
  transactionId: string;
  reason: string;
  description: string;
  reporterId: string;
  status: DisputeStatus;
}

export interface IUpdateDispute {
  status?: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
}
