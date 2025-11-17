export type Language = 'en' | 'es' | 'ja' | 'ko' | 'zh';

export type AccountType = 'consumer' | 'business';

export type CafeStatus = 'open' | 'closed' | 'busy';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  accountType: AccountType;
  visibility: 'public' | 'private';
  language: Language;
  reviewCount: number;
  friendCount: number;
}

export interface Cafe {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: number;
  status: CafeStatus;
  categories: string[];
  priceRange: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  hours: {
    day: string;
    open: string;
    close: string;
  }[];
  photos: string[];
  popularTimes: {
    day: string;
    hours: number[];
  }[];
  amenities: string[];
  description: string;
  aiAnalysis?: string;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  cafeId: string;
  cafeName: string;
  rating: number;
  text: string;
  photos: string[];
  date: string;
  helpful: number;
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'friends' | 'pending' | 'request';
  mutualFriends: number;
  reviewCount: number;
}

export interface Activity {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  type: 'review' | 'visit' | 'favorite';
  cafeId: string;
  cafeName: string;
  cafeImage: string;
  rating?: number;
  text?: string;
  timestamp: string;
}

export interface Collection {
  id: string;
  name: string;
  cafes: Cafe[];
  count: number;
}
