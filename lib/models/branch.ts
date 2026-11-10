export type BranchServiceArea =
  | {
      type: "postcodes";
      postcodes?: string[];
    }
  | {
      type: "radius";
      centerLatitude?: number;
      centerLongitude?: number;
      radiusMeters?: number;
    }
  | {
      type: string;
      [key: string]: unknown;
    };

export type Branch = {
  id: string;
  name: string;
  isActive: boolean;
  serviceArea: BranchServiceArea | null;
};
