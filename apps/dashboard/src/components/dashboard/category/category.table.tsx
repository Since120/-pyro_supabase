'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Box,
  Button,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryRow from './category.row';
import { Column, EditCategoryData } from './types';
import { sortCategories, Order } from './sort.utils';
import SortableTableCell from './sortable.table.cell';
import SetupCategory from './setup/setup.category';
import SetupZone from './setup/setup.zone';
import EditCategory from './edit/edit.category';
import EditZone from './edit/edit.zone';
// Alte GraphQL-Hooks durch Supabase-Hooks ersetzen
import { useSupabaseCategories } from '@/hooks/categories/use.supabase.categories';
// Type für Supabase anpassen
import { EntityType, OperationType, CategoryEventType } from '@/services/EventManager/typeDefinitions';
import { useSnackbar } from 'notistack';
import { useEventManager } from '@/services/EventManager';

const columns: Column[] = [
  { key: 'name', label: 'Kategorie', align: 'left' },
  { key: 'categoryType', label: 'Kategorie Typ', align: 'left' },
  { key: 'isVisible', label: 'Sichtbar', align: 'left' },
  { key: 'trackingActive', label: 'Tracking', align: 'left' },
  { key: 'sendSetup', label: 'Setup Senden', align: 'left' },
  { key: 'lastUsage', label: 'Letzte Nutzung', align: 'left' },
];

const CategoryTable: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('name');
  // Guild ID bestimmen (in einer realen Anwendung würde dies aus dem Kontext kommen)
  const guildId = process.env.NEXT_PUBLIC_GUILD_ID || ''; // Standard-Guild ID aus .env

  // Neue Supabase-Hooks verwenden
  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories
  } = useSupabaseCategories(guildId);

  // Seite neu laden, wenn sie gemountet wird
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Zonen via API (noch nicht migriert) - TEMPORÄR DEAKTIVIERT
  const zonesData = { zones: [] }; // Leeres Array für Zonen, bis die Migration abgeschlossen ist
  const zonesLoading = false;
  const zonesError = null;

  // Enhanced categories: Jede Kategorie erhält ihre zugehörigen Zonen
  const enhancedCategories = categories.map((cat) => {
    const zones = zonesData?.zones.filter((zone: any) => zone.categoryId === cat.id) || [];
    return {
      ...cat,
      // Anpassungen für die Kompatibilität mit dem bisherigen Code
      categoryType: cat.category_type,
      isVisible: cat.is_visible,
      trackingActive: cat.is_tracking_active,
      sendSetup: cat.is_send_setup,
      zones,
      zoneCount: zones.length,
    };
  });

  // Sortierung
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder: Order = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
  };

  // Setup Wizard Modal für Kategorie-Erstellung
  const [openWizard, setOpenWizard] = useState(false);
  const handleOpenWizard = () => {
    console.log('[CategoryTable] Öffne Kategorie-Erstellungs-Modal');
    setOpenWizard(true);
  };
  const handleCloseWizard = () => {
    console.log('[CategoryTable] Schließe Kategorie-Erstellungs-Modal');
    setOpenWizard(false);
  };

  // Setup Zone Modal für neue Zonen
  const [openZone, setOpenZone] = useState(false);
  const handleOpenZone = () => setOpenZone(true);
  const handleCloseZone = () => setOpenZone(false);

  // Edit Zone Modal
  const [zoneEditOpen, setZoneEditOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<null | any>(null);
  const handleEditZone = (zone: any) => {
    setEditingZone(zone);
    setZoneEditOpen(true);
  };

  // Globale Selektion für Kategorien (über den Namen) und Aggregation der ausgewählten Zonen
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelection = (categoryName: string) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(categoryName)) {
        newSelected.delete(categoryName);
      } else {
        newSelected.add(categoryName);
      }
      return newSelected;
    });
  };
  const clearCategorySelection = useCallback((categoryName: string) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);
      newSelected.delete(categoryName);
      return newSelected;
    });
  }, []);
  const handleZoneSelect = useCallback(() => {
    setSelected(new Set());
  }, []);
  const [zoneSelected, setZoneSelected] = useState(false);

  // Neuer Zustand, um die in den einzelnen CategoryRow selektierten Zone-IDs zu sammeln
  const [zoneSelections, setZoneSelections] = useState<{ [categoryId: string]: string[] }>({});

  const handleZoneIdsChange = useCallback((categoryId: string, selectedZoneIds: string[]) => {
    setZoneSelections(prev => {
      // Vergleiche, ob sich die Auswahl tatsächlich geändert hat
      const currentSelection = prev[categoryId] || [];
      
      // Einfacher Vergleich der Länge
      if (currentSelection.length !== selectedZoneIds.length) {
        return {
          ...prev,
          [categoryId]: selectedZoneIds,
        };
      }
      
      // Tieferer Vergleich der Inhalte
      const hasChanged = !currentSelection.every(id => selectedZoneIds.includes(id)) || 
                         !selectedZoneIds.every(id => currentSelection.includes(id));
      
      if (hasChanged) {
        return {
          ...prev,
          [categoryId]: selectedZoneIds,
        };
      }
      
      // Wenn keine Änderung, gib den vorherigen State zurück (kein Re-rendering)
      return prev;
    });
  }, []);

  const showDelete = selected.size > 0 || zoneSelected;

  const mobileButtonStyles = {
    fontSize: { xs: '0.75rem', sm: 'inherit' },
    px: { xs: 1, sm: 2 },
    py: { xs: 0.5, sm: 1 },
  };

  // Master Edit Modal (Kategorie)
  const [masterEditOpen, setMasterEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setMasterEditOpen(true);
  };

  // Snackbar-Benachrichtigungen
  const { enqueueSnackbar } = useSnackbar();
  const [deletedZones, setDeletedZones] = useState<Set<string>>(new Set());
  const { startOperation, completeOperation } = useEventManager();

  // Konstante für Bulk-Operation
  const BULK_DELETE_OPERATION_ID = 'bulk-delete-operation';

  const handleDelete = async () => {
    if (selected.size > 0) {
      // Lösche alle selektierten Kategorien
      const categoriesToDelete = enhancedCategories.filter(cat => selected.has(cat.name));
      
      // Starte eine Gruppen-Operation im Event-Manager
      startOperation({
        id: BULK_DELETE_OPERATION_ID,
        entityType: EntityType.CATEGORY,
        operationType: OperationType.DELETE,
        modalId: '' // Kein Modal für Bulk-Operationen
      });
      
      let hasErrors = false;
      
      for (const cat of categoriesToDelete) {
        try {
          // Stelle sicher, dass keine erneute Löschung stattfindet
          if (!deletedZones.has(cat.id)) {
            // Starte eine Operation für jede Kategorie
            startOperation({
              id: cat.id,
              entityType: EntityType.CATEGORY,
              operationType: OperationType.DELETE,
              modalId: '' // Kein Modal für diese einzelne Operation
            });
            
            // Verwende den Supabase-Hook direkt
            await deleteCategory(cat.id);
            
            // Markiere die Operation als erfolgreich
            completeOperation({
              id: cat.id,
              success: true,
              eventType: CategoryEventType.DELETED
            });
            
            // Füge die gelöschte Kategorie zu deletedZones hinzu
            setDeletedZones(prev => new Set(prev.add(cat.id)));
            
            // Inkrementelles Feedback
            enqueueSnackbar(`Kategorie "${cat.name}" gelöscht`, { variant: 'success' });
          }
        } catch (error) {
          hasErrors = true;
          completeOperation({
            id: cat.id,
            success: false,
            error: error instanceof Error ? error : new Error('Unbekannter Fehler'),
            eventType: CategoryEventType.ERROR
          });
          enqueueSnackbar(`Fehler beim Löschen von "${cat.name}"`, { variant: 'error' });
        }
      }
      
      // Beende die Gruppen-Operation
      completeOperation({
        id: BULK_DELETE_OPERATION_ID,
        success: !hasErrors,
        eventType: CategoryEventType.DELETED
      });
      
      // Leere die Selektion
      setSelected(new Set());
      
      // Aktualisiere die Kategorie-Liste
      fetchCategories();
    }
  };

  // Render-Funktionen
  const getRowComponent = (category: any) => {
    return (
      <CategoryRow
        key={category.id}
        category={category}
        isSelected={selected.has(category.name)}
        onToggleSelection={() => toggleSelection(category.name)}
        onClearCategorySelection={() => clearCategorySelection(category.name)}
        globalCategorySelected={selected.size > 0}
        onZoneSelect={handleZoneSelect}
        onZoneSelectionChange={setZoneSelected}
        onEditCategory={() => handleEditCategory(category)}
        onEditZone={handleEditZone}
        onZoneIdsChange={(categoryId, selectedZoneIds) => handleZoneIdsChange(categoryId, selectedZoneIds)}
      />
    );
  };

  const renderRows = () => {
    if (categoriesLoading || zonesLoading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 2} align="center">
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if ((categoriesError || zonesError) && !enhancedCategories.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 2} align="center">
            <Box sx={{ my: 2 }}>
              Fehler beim Laden der Daten. Bitte versuche es später erneut.
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (!enhancedCategories.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 2} align="center">
            <Box sx={{ my: 2 }}>
              Keine Kategorien vorhanden. Erstelle eine neue Kategorie, um zu beginnen.
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    // Sortiere die Kategories je nach Sortierparameter
    const sortedCategories = sortCategories(enhancedCategories, orderBy, order);
    return sortedCategories.map(getRowComponent);
  };

  return (
    <Box
      sx={{
        maxWidth: 'var(--Content-maxWidth)',
        m: 'var(--Content-margin)',
        p: 'var(--Content-padding)',
        width: 'var(--Content-width)',
      }}
    >
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenWizard}
              startIcon={<AddIcon />}
              sx={mobileButtonStyles}
            >
              Neue Kategorie
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenZone}
              startIcon={<AddIcon />}
              sx={mobileButtonStyles}
            >
              Neue Zone
            </Button>
          </Box>
          {showDelete && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
              sx={mobileButtonStyles}
            >
              Löschen ({selected.size})
            </Button>
          )}
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                {columns.map((column) => (
                  <SortableTableCell
                    key={column.key}
                    columnKey={column.key}
                    label={column.label}
                    orderBy={orderBy}
                    order={order}
                    onRequestSort={handleRequestSort}
                    align={column.align}
                  />
                ))}
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        </TableContainer>

        {/* Modals */}
        <SetupCategory
          open={openWizard}
          onClose={handleCloseWizard}
        />

        {/* Zonen-Erstellungsmodal */}
        <SetupZone
          open={openZone}
          onClose={handleCloseZone}
          categories={enhancedCategories.map(cat => ({ id: cat.id, name: cat.name }))}
        />

        {/* Kategorie-Bearbeitungsmodal */}
        {editingCategory && (
          <EditCategory
            open={masterEditOpen}
            onClose={() => setMasterEditOpen(false)}
            initialData={{
              id: editingCategory.id,
              categoryName: editingCategory.name,
              selectedLevel: editingCategory.category_type,
              role: editingCategory.allowed_roles,
              tracking: editingCategory.is_tracking_active,
              visible: editingCategory.is_visible,
              sendSetup: editingCategory.is_send_setup
            }}
            onSave={async (formData) => {
              try {
                await updateCategory(editingCategory.id, {
                  name: formData.categoryName,
                  category_type: formData.selectedLevel,
                  allowed_roles: formData.role,
                  is_visible: formData.visible,
                  is_tracking_active: formData.tracking,
                  is_send_setup: formData.sendSetup
                });
                setMasterEditOpen(false);
                await fetchCategories(); // Daten aktualisieren
              } catch (error) {
                console.error('Fehler beim Aktualisieren der Kategorie:', error);
              }
            }}
          />
        )}

        {/* Zonen-Bearbeitungsmodal */}
        {editingZone && (
          <EditZone
            open={zoneEditOpen}
            onClose={() => setZoneEditOpen(false)}
            initialData={editingZone}
            categories={enhancedCategories.map(cat => ({ id: cat.id, name: cat.name }))}
            onSave={async (updatedZone) => {
              // Hier muss später die Logik zur Aktualisierung der Zone über Supabase implementiert werden
              setZoneEditOpen(false);
              // Daten aktualisieren
              await fetchCategories();
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default CategoryTable;