export type ShoppingList = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type ShoppingItemInput = {
  name: string;
  quantity: string;
};

export type FirestoreSyncState = {
  fromCache: boolean;
  hasPendingWrites: boolean;
};
