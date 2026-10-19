import type { Rel, SweetId } from "./card";

/** Ready-made lines in the creator. Everyday Kolkata Banglish, not greeting-card Bangla. */
export const READY_LINES: Record<Rel, string[]> = {
  elder: [
    "Video call-এ তো পা ছোঁয়া যায় না, তাই চিঠিটাই পাঠালাম।",
    "বাড়ি গিয়ে আগে তোমার হাতের নাড়ু খাব, তারপর বাকি কথা।",
    "এবারও ঠাকুর দেখে বলা সময়ে বাড়ি ফিরিনি। পরের বার ফিরব, promise.",
  ],
  friend: [
    "তোদের বাড়ির ঘুগনিটা এবারও বাকি রইল। কবে যাচ্ছি বল।",
    "পুজো শেষ, group chat আবার চুপ হয়ে যাবে। তার আগে বিজয়াটা সেরে রাখলাম।",
    "অষ্টমীর ছবিগুলো এখনও পাঠাসনি। মিষ্টির সঙ্গে ওগুলোও চাই।",
  ],
  younger: [
    "পড়াশোনা হোক না হোক, বিজয়ার মিষ্টিটা ঠিক করে খাস।",
    "পুজোয় কত খরচ করেছিস, বাড়িতে বলিনি। চিন্তা নেই।",
    "পরের বার ঠাকুর দেখতে বেরোলে আমাকেও ডাকিস।",
  ],
  office: [
    "ছুটি শেষ, কিন্তু মিষ্টির box এখনও শেষ হয়নি।",
    "Monday-তে meeting-এ দেখা হবে। মিষ্টিটা আমি আনছি।",
    "Leave approve করার জন্য thank you. পরের বছরও যেন হয়।",
  ],
};

/** Shows up on a paper chit after the sweet is finished. */
export const SWEET_LINES: Record<SweetId, string> = {
  rosogolla: "রস জামায় পড়েছে তো? জানতাম।",
  sandesh: "সন্দেশ শেষ। Diet কাল থেকে।",
  naru: "নাড়ুটা বাড়িতে বানানো, দোকানের না।",
  langcha: "শক্তিগড়ের ল্যাংচা, highway-তে গাড়ি থামিয়ে কেনা।",
  pantua: "পান্তুয়া আর গোলাপজাম এক জিনিস না। এ নিয়ে তর্ক চলবে না।",
};
