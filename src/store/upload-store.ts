"use client";
import { create } from 'zustand';

interface UploadState {
    isOpen: boolean;
    videoBlob: Blob | null;
    fileName: string;
    open: (blob: Blob, defaultName?: string) => void;
    close: () => void;
    setFileName: (name: string) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
    isOpen: false,
    videoBlob: null,
    fileName: '',
    open: (blob, defaultName = '') =>
        set({isOpen: true, videoBlob: blob, fileName: defaultName}),
    close: () =>
        set({isOpen: false, videoBlob: null, fileName: ''}),
    setFileName: (name) =>
        set({fileName: name}),
}));