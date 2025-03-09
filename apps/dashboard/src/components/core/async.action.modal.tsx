// apps/dashboard/src/components/core/async.action.modal.tsx
import React, { useState, useEffect } from 'react';
import { Box, Modal, Button, Typography, Fade, CircularProgress } from '@mui/material';
import AnimatedCheck from './AnimatedCheck';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface AsyncActionModalProps<T> {
	open: boolean;
	onClose: () => void;
	// Die asynchrone Aktion, z.B. eine Mutation, die einen Wert vom Typ T liefert
	action: () => Promise<T>;
	// Callback, wenn die Aktion erfolgreich abgeschlossen wurde
	onSuccess: (result: T) => void;
	spinnerText?: string;
	errorText?: string;
	successText?: string;
	reloadText?: string;
	children: React.ReactNode;
	/** Wenn true, wird die Aktion automatisch gestartet, sobald das Modal geöffnet wird */
	autoStart?: boolean;
}

const modalStyle = {
	position: 'absolute' as const,
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: { xs: '90%', sm: 400 },
	maxWidth: '95%',
	bgcolor: 'background.paper',
	borderRadius: '8px',
	boxShadow: 24,
	p: { xs: 2, sm: 3 },
};

function AsyncActionModal<T>({
	open,
	onClose,
	action,
	onSuccess,
	spinnerText = 'Speichern...',
	errorText = 'Ups, da ist etwas schiefgelaufen.',
	successText = 'Erfolg!',
	reloadText = 'Erneut versuchen',
	children,
	autoStart = false,
}: AsyncActionModalProps<T>) {
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [showSuccess, setShowSuccess] = useState<boolean>(false);

	const handleAction = async () => {
		setError(null);
		setIsSaving(true);
		try {
			const result = await action();
			setIsSaving(false);
			setShowSuccess(true);
			onSuccess(result);
			setTimeout(() => {
				setShowSuccess(false);
				onClose();
			}, 2000);
		} catch (err: any) {
			console.error('AsyncActionModal error:', err);
			setIsSaving(false);
			setError(errorText);
		}
	};

	const handleReload = () => {
		setError(null);
		if (autoStart) {
			handleAction();
		}
	};

	// Auto-Start der Aktion, wenn das Modal geöffnet wird
	useEffect(() => {
		if (open && autoStart && !isSaving && !error) {
			handleAction();
		}
	}, [open, autoStart]);

	return (
		<Modal
			open={open || showSuccess || Boolean(error)}
			onClose={onClose}
			disableEscapeKeyDown={showSuccess || Boolean(error)}
		>
			<Fade in={open || showSuccess || Boolean(error)} timeout={500}>
				<Box sx={modalStyle}>
					{showSuccess ? (
						<Box sx={{ textAlign: 'center' }}>
							<AnimatedCheck />
							<Typography variant="h6" sx={{ mt: 2 }}>
								{successText}
							</Typography>
						</Box>
					) : error ? (
						<Box sx={{ textAlign: 'center' }}>
							<ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
							<Typography variant="h6" sx={{ mt: 2 }}>
								{error}
							</Typography>
							<Button variant="contained" color="error" sx={{ mt: 2 }} onClick={handleReload}>
								{reloadText}
							</Button>
						</Box>
					) : isSaving ? (
						<Box sx={{ textAlign: 'center' }}>
							<CircularProgress />
							<Typography variant="h6" sx={{ mt: 2 }}>
								{spinnerText}
							</Typography>
						</Box>
					) : (
						// Falls autoStart nicht aktiv ist, werden Inhalte und ein manueller Speichern-Button angezeigt
						<>
							{children}
							<Button variant="contained" onClick={handleAction} sx={{ mt: 2 }}>
								Speichern
							</Button>
						</>
					)}
				</Box>
			</Fade>
		</Modal>
	);
}

export default AsyncActionModal;
