// src/components/ui/use-toast.tsx

import { toast as hotToast, Toaster as HotToaster } from "react-hot-toast";

// Ekspor toast agar dapat digunakan di seluruh aplikasi
export const toast = hotToast;

// Ekspor komponen Toaster untuk menampilkan toast
export const Toaster = HotToaster;
