export type UserType = {
  uid: string;

  fullName: string;
  email: string;
  phone: string;
  location?: string;

  role: string;
  status: string;

  farmName?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  about?: string;

  coverPhoto?: string;
  coverPhotoPublicId?: string;

  profileImage?: string;

  profileImagePublicId?: string;
};