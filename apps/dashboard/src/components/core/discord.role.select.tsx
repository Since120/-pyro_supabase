// apps/dashboard/src/components/core/discord.role.select.tsx
import React from 'react';
import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	SelectChangeEvent,
	Chip,
	Box,
	Typography,
	useTheme,
	CircularProgress
} from '@mui/material';
import { useSupabaseRoles } from '@/hooks/roles/use.supabase.roles';
import { DiscordRole } from '@/types/role.types'; // Direkter Import aus types

export interface DiscordRoleSelectProps {
	multiple?: boolean;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	disabled?: boolean;
}

// Konvertiert den integer Farbwert in einen hexadezimalen Farbstring.
// Falls der Wert ungültig oder 0 ist, wird "#808080" (neutraler Grau) zurückgegeben.
const getColorHex = (color: number): string => {
	if (typeof color !== 'number' || isNaN(color) || color === 0) {
		return '#808080';
	}
	return '#' + color.toString(16).padStart(6, '0').toUpperCase();
};

const DiscordRoleSelect: React.FC<DiscordRoleSelectProps> = ({ 
	multiple = false, 
	value, 
	onChange, 
	disabled = false
}) => {
	const theme = useTheme();
	// Supabase Rollen verwenden
	const { loading, error, data } = useSupabaseRoles();
	const roles: DiscordRole[] = data?.discordRoles || [];

	const handleChange = (event: SelectChangeEvent<typeof value>) => {
		onChange(event.target.value);
	};

	// Zeige den Ladezustand innerhalb des Selects, statt einen separaten Indikator
	const isLoading = loading;
	
	// Bei Fehler einen besseren Fehlerindikator anzeigen
	if (error) {
		console.error('Fehler im DiscordRoleSelect:', error);
		return (
			<Box sx={{ p: 2, color: 'error.main', border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
				<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
					Fehler beim Laden der Rollen
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					{error.message}
				</Typography>
				<Button 
					variant="outlined" 
					color="error" 
					size="small" 
					sx={{ mt: 1 }}
					onClick={() => data ? data.refetch() : null}
				>
					Erneut versuchen
				</Button>
			</Box>
		);
	}

	// Sortiere Rollen nach Position (wichtige Rollen zuerst)
	const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

	return (
		<FormControl fullWidth disabled={disabled || isLoading}>
			<InputLabel id="discord-role-select-label">
				{isLoading ? 'Lade Rollen...' : 'Rolle(n) auswählen'}
			</InputLabel>
			<Select
				labelId="discord-role-select-label"
				multiple={multiple}
				value={value}
				label={isLoading ? 'Lade Rollen...' : 'Rolle(n) auswählen'}
				onChange={handleChange}
				startAdornment={
					isLoading ? (
						<CircularProgress size={20} sx={{ ml: 1, mr: 1 }} color="inherit" />
					) : undefined
				}
				renderValue={(selected) => {
					const selectedArray: string[] = Array.isArray(selected) ? selected : [selected as string];
					return (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
							{selectedArray.map((roleId) => {
								const role = roles.find((r) => r.id === roleId);
								return (
									<Chip
										key={roleId}
										label={
											<Typography
												sx={{
													// Im Dark Mode soll der Text schwarz, im Light Mode weiß sein
													color: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
												}}
											>
												{role ? role.name : roleId}
											</Typography>
										}
										size="small"
										onDelete={
											multiple && !disabled
												? (e) => {
														e.stopPropagation();
														e.preventDefault();
														const newValue = selectedArray.filter((id) => id !== roleId);
														onChange(newValue);
													}
												: undefined
										}
										deleteIcon={
											multiple && !disabled ? (
												<span
													onMouseDown={(e) => {
														e.stopPropagation();
														e.preventDefault();
													}}
												>
													×
												</span>
											) : undefined
										}
										sx={{
											backgroundColor: role && role.color !== 0 ? getColorHex(role.color) : undefined,
										}}
									/>
								);
							})}
						</Box>
					);
				}}
			>
				{sortedRoles.map((role) => (
					<MenuItem key={role.id} value={role.id}>
						<Box 
							sx={{ 
								display: 'flex', 
								alignItems: 'center',
								gap: 1
							}}
						>
							<Box 
								sx={{ 
									width: 16, 
									height: 16, 
									borderRadius: '50%', 
									bgcolor: getColorHex(role.color),
									flexShrink: 0
								}} 
							/>
							<Typography>{role.name}</Typography>
						</Box>
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

export default DiscordRoleSelect;