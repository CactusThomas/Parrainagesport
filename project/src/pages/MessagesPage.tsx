// src/pages/MessagesPage.tsx
import React from 'react';
import ChatListPage from './ChatListPage';

const MessagesPage: React.FC = () => {
  // Wrapper simple pour la route /messages : affiche la liste des conversations
  return <ChatListPage />;
};

export default MessagesPage;
