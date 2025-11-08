// src/components/EditTaskModal.js
import React, { useState, useEffect } from 'react';
import './EditTaskModal.css';

function EditTaskModal({ isOpen, onClose, onSaveTask, task }) {
  const [taskContent, setTaskContent] = useState('');

  // Reset form when modal opens with task data
  useEffect(() => {
    if (isOpen && task) {
      setTaskContent(task.content);
    }
  }, [isOpen, task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskContent.trim()) {
      onSaveTask(taskContent.trim());
      setTaskContent('');
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
          <h3>Edit Task</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          <textarea
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="Edit task description..."
            autoFocus
            rows="4"
            className="task-input"
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
              disabled={!taskContent.trim()}
              className="submit-btn"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;