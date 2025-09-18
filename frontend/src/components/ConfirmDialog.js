import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Abbrechen</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Bestätigen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;