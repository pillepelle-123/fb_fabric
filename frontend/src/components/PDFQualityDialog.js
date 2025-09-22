import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const qualityOptions = [
  {
    value: 'small',
    label: 'Kleine Dateigröße',
    quality: 0.5,
    format: 'jpeg',
    tooltip: 'JPEG 50% - Kleinste Dateigröße, geeignet für digitale Ansicht und E-Mail-Versand'
  },
  {
    value: 'medium',
    label: 'Ausgewogen',
    quality: 0.7,
    format: 'jpeg',
    tooltip: 'JPEG 70% - Gute Balance zwischen Dateigröße und Qualität, empfohlen für die meisten Anwendungen'
  },
  {
    value: 'high',
    label: 'Hohe Qualität',
    quality: 0.9,
    format: 'jpeg',
    tooltip: 'JPEG 90% - Hohe Qualität mit größerer Dateigröße, gut für Bildschirmanzeige'
  },
  {
    value: 'print',
    label: 'Druckqualität',
    quality: 1.0,
    format: 'png',
    tooltip: 'PNG verlustfrei - Beste Qualität für professionellen Druck, sehr große Dateigröße'
  }
];

const PDFQualityDialog = ({ open, onClose, onConfirm }) => {
  const [selectedQuality, setSelectedQuality] = useState('medium');

  const handleConfirm = () => {
    const option = qualityOptions.find(opt => opt.value === selectedQuality);
    onConfirm(option);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>PDF-Qualität wählen</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend">Qualitätseinstellung</FormLabel>
          <RadioGroup
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            sx={{ mt: 1 }}
          >
            {qualityOptions.map((option) => (
              <Box key={option.value} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  sx={{ flexGrow: 1 }}
                />
                <Tooltip title={option.tooltip} placement="right">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleConfirm} variant="contained">PDF erstellen</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFQualityDialog;