// src/components/CreateBoardModal.js
import React, { useState, useEffect } from 'react';
import './CreateBoardModal.css';

function CreateBoardModal({ isOpen, onClose, onCreateBoard }) {
  const [boardName, setBoardName] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBoardName('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (boardName.trim()) {
      onCreateBoard(boardName.trim());
      setBoardName('');
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Board</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="board-form">
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Enter board name..."
            autoFocus
            className="board-input"
          />
          
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!boardName.trim()}
              className="submit-btn"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBoardModal;