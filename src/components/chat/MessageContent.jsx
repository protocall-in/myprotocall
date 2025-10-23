import React from 'react';
import { File, Download } from 'lucide-react';

export default function MessageContent({ message }) {
  switch (message.message_type) {
    case 'image':
      return (
        <a href={message.file_url} target="_blank" rel="noopener noreferrer">
          <img
            src={message.file_url}
            alt={message.content || 'Uploaded image'}
            className="rounded-lg max-w-full h-auto mt-1"
          />
        </a>
      );
    case 'file':
      return (
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-slate-200 rounded-lg mt-1 hover:bg-slate-300 transition-colors"
        >
          <File className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <span className="text-sm text-slate-800 truncate flex-1">{message.file_name || 'Attached File'}</span>
          <Download className="w-4 h-4 text-slate-500" />
        </a>
      );
    default:
      return (
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      );
  }
}