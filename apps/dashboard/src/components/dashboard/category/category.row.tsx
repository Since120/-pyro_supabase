'use client';

import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Typography,
  Box,
  Table,
  TableHead,
  TableBody,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Edit as EditIcon } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { Category as GeneratedCategory, Zone } from '@/graphql/generated/graphql';

// ExtendedCategory erweitert den generierten Category-Typ um die Eigenschaft zones
export type ExtendedCategory = GeneratedCategory & { zones: Zone[] };

interface CategoryRowProps {
  category: ExtendedCategory;
  defaultOpen?: boolean;
  isSelected: boolean;
  onToggleSelection: (categoryName: string) => void;
  onClearCategorySelection: (categoryName: string) => void;
  globalCategorySelected: boolean;
  onZoneSelect: () => void;
  onZoneSelectionChange: (hasSelection: boolean) => void;
  onEditCategory?: (category: ExtendedCategory) => void;
  onEditZone?: (zone: Zone) => void;
  // Callback, um die aktuell selektierten Zone-IDs dieser Kategorie an den Parent zu übermitteln
  onZoneIdsChange?: (categoryId: string, selectedZoneIds: string[]) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  defaultOpen = false,
  isSelected,
  onToggleSelection,
  onClearCategorySelection,
  globalCategorySelected,
  onZoneSelect,
  onZoneSelectionChange,
  onEditCategory,
  onEditZone,
  onZoneIdsChange,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const { id, name, categoryType, isVisible, isTrackingActive, isSendSetup, lastUsageAt, zones } = category;
  
  // Lokaler Zustand zur Speicherung der in dieser Kategorie selektierten Zone-IDs
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(zoneId)) {
        newSelected.delete(zoneId);
      } else {
        newSelected.add(zoneId);
      }
      return newSelected;
    });
    onZoneSelect();
  };

  // Nach Update der Selektion wird der Callback im Parent aufgerufen
  useEffect(() => {
    if (onZoneIdsChange) {
      // Vermeide häufige Aufrufe, indem wir die selectedZoneIds als Array konvertieren
      // und nur aufrufen, wenn sich die Anzahl oder Inhalte geändert haben
      const zoneIdsArray = Array.from(selectedZoneIds);
      onZoneIdsChange(id, zoneIdsArray);
    }
  }, [selectedZoneIds, id, onZoneIdsChange]);

  useEffect(() => {
    onZoneSelectionChange(selectedZoneIds.size > 0);
  }, [selectedZoneIds, onZoneSelectionChange]);

  useEffect(() => {
    if (globalCategorySelected) {
      setSelectedZoneIds(new Set());
      onZoneSelectionChange(false);
    }
  }, [globalCategorySelected, onZoneSelectionChange]);

  useEffect(() => {
    if (selectedZoneIds.size > 0 && isSelected) {
      onClearCategorySelection(name);
    }
  }, [selectedZoneIds, isSelected, name, onClearCategorySelection]);

  const handleCategoryClick = () => {
    setSelectedZoneIds(new Set());
    onZoneSelectionChange(false);
    onToggleSelection(name);
  };

  return (
    <>
      {/* Masterzeile */}
      <TableRow
        hover
        onClick={handleCategoryClick}
        sx={{
          backgroundColor: isSelected
            ? `${alpha(theme.palette.primary.main, 0.2)} !important`
            : 'inherit',
          '&:hover': {
            backgroundColor: isSelected
              ? `${alpha(theme.palette.primary.main, 0.2)} !important`
              : theme.palette.grey[200],
          },
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
        }}
      >
        {/* Expand/Collapse-Button */}
        <TableCell
          width={50}
          align="center"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <IconButton size="small" aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>

        {/* Kategorie-Name */}
        <TableCell component="th" scope="row">
          {name}
        </TableCell>

        {/* Kategorie Typ */}
        <TableCell>{categoryType}</TableCell>

        {/* Sichtbar */}
        <TableCell>{isVisible ? 'Ja' : 'Nein'}</TableCell>

        {/* Tracking */}
        <TableCell>{isTrackingActive ? 'Ja' : 'Nein'}</TableCell>

        {/* Setup Senden */}
        <TableCell>{isSendSetup ? 'Ja' : 'Nein'}</TableCell>

        {/* Letzte Nutzung */}
        <TableCell>{lastUsageAt ? new Date(lastUsageAt).toLocaleString() : '-'}</TableCell>

        {/* Edit-Button */}
        <TableCell align="right">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (onEditCategory) {
                onEditCategory(category);
              }
            }}
            size="small"
            aria-label="Edit Category"
          >
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Slavezeile: Enthaltet die Zonentabelle */}
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="subtitle1" gutterBottom component="div">
                {/* Zonen in {name} */}
              </Typography>
              <Table size="small" aria-label={`Zonen von ${name}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Zone Key</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Minutes Required</TableCell>
                    <TableCell>Points Granted</TableCell>
                    <TableCell>Last Usage</TableCell>
                    <TableCell>Total Seconds in Zone</TableCell>
                    <TableCell align="right">Edit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow
                      key={zone.id}
                      hover
                      onClick={() => toggleZoneSelection(zone.id)}
                      sx={{
                        backgroundColor: selectedZoneIds.has(zone.id)
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'inherit',
                        '&:hover': {
                          backgroundColor: selectedZoneIds.has(zone.id)
                            ? `${alpha(theme.palette.primary.main, 0.1)} !important`
                            : theme.palette.grey[200],
                        },
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell>{zone.zoneKey}</TableCell>
                      <TableCell>{zone.name}</TableCell>
                      <TableCell>{zone.minutesRequired}</TableCell>
                      <TableCell>{zone.pointsGranted}</TableCell>
                      <TableCell>{zone.lastUsageAt ? new Date(zone.lastUsageAt).toLocaleString() : '-'}</TableCell>
                      <TableCell>{zone.totalSecondsInZone}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditZone) {
                              onEditZone(zone);
                            }
                          }}
                          size="small"
                          aria-label="Edit Zone"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default CategoryRow;