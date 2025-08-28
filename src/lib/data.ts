export interface Dinner {
    id: string; // Changed to string for Firestore document IDs
    creatorId: string;
    creatorName: string;
    creatorUsername: string;
    creatorImage: string;
    hostAverageRating?: number;
    hostReviewCount?: number;
    restaurantName: string;
    address: string;
    city: string;
    cuisine: string;
    dietary: 'Veg' | 'Non-Veg' | 'Vegan';
    budget: '$' | '$$' | '$$$' | '$$$$';
    maxGuests: number;
    filledSlots: number;
    bookedBy: string[]; // Keep track of user IDs who have booked
    attendees?: { uid: string; name: string; username: string; avatar: string; }[], // List of attendees
    reviews?: Record<string, string[]>; // Who has reviewed whom for this dinner. { reviewerId: [revieweeId1, revieweeId2] }
    date: string;
    time: string;
    createdAt?: any; // To use with serverTimestamp
}

export interface Comment {
    id: string;
    text: string;
    userId: string;
    userName:string;
    userImage: string;
    createdAt: any;
    readBy: string[];
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    revieweeId: string; // The user ID of the person being reviewed
    revieweeName: string;
    reviewerId: string; // The user ID of the person leaving the review
    reviewerName: string;
    reviewerImage: string;
    dinnerId: string;
    dinnerName: string;
    isHostReview: boolean; // Was the reviewee the host of this dinner?
    createdAt: any;
}

export interface Notification {
  id: string;
  type: 'booking' | 'cancellation' | 'message';
  dinnerId: string;
  dinnerName: string;
  actorId: string; // User who performed the action
  actorName: string;
  recipientId: string; // User who should receive the notification (e.g., the host)
  read: boolean;
  createdAt: any;
}


export const cities = ['Berlin', 'Frankfurt', 'Hamburg', 'Ludwigsburg', 'Munich', 'Stuttgart', 'Ulm'];
export const dietaryOptions = ['Non-Veg', 'Veg', 'Vegan'];
    