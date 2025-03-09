import React, { useState } from 'react';
import {
	TextField,
	InputAdornment,
	IconButton,
	Popover,
	Box,
	Grid,
	Button as MuiButton,
	Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

export interface PickerTextFieldProps {
	label?: string;
	value: string;
	onChange: (newValue: string) => void;
	enableEmojiPicker?: boolean;
	enableSpecialPicker?: boolean;
	// Für die TypeScript-Kompatibilität, aber wir verwenden es nicht direkt
	// stattdessen wird es an TextField weitergegeben
	disabled?: boolean;
}

// Erweiterte Sonderzeichen-Gruppen
const specialCharGroups = [
	{
		group: 'Horizontal Lines',
		symbols: ['─', '┄', '┈', '━', '═', '―', '—', '–', '⎯', '▭', '╌', '╍', '┅'],
	},
	{
		group: 'Vertical Lines & Corners',
		symbols: [
			'│',
			'┃',
			'║',
			'┊',
			'┆',
			'┌',
			'┐',
			'└',
			'┘',
			'╔',
			'╗',
			'╚',
			'╝',
			'╰',
			'╮',
			'╭',
			'╯',
			'┏',
			'┓',
			'【',
			'】',
			'〘',
			'〙',
			'┗',
			'┛',
		],
	},
	{
		group: 'Decorative Symbols & Accents',
		symbols: [
			'★',
			'☆',
			'✦',
			'✧',
			'✪',
			'✫',
			'❯',
			'➤',
			'➔',
			'»',
			'•',
			'◉',
			'∘',
			'❘',
			'❙',
			'→',
			'↠',
			'⇨',
			'➞',
			'⇨',
			'→',
			'←',
			'⚡',
			'✹',
			'彡',
			'❖',
		],
	},
	{
		group: 'Miscellaneous',
		symbols: ['≡', '≈', '¤', '§', '∞', '∑', '∆', 'Ω', 'µ', '♪', '♫'],
	},
];

const specialCharExamples = [
	'═══ General ⭐ ═════════',
	'────────────── Voice 📢',
	'╭─•─•─📰 News 📰•─•─•─╮',
	'❖❖❖ 🔄 Updates 🔄 ❖❖❖',
	'━━ 📣 Announcements 📣 ━━',
	'┏━━ ⚠️ Alerts ⚠️ ━━┓',
	'╭─── 💬 General 💬 ───╮',
	'┌── ℹ️ Info ℹ️ ──┐',
	'☆彡 🗣️ Chatroom 🗣️ 彡☆',
	'┅┅┅ 🎵 Music 🎵 ┅┅┅',
	'╰┈→ ❌ Error ❌ ←┈╮',
	'➳➳ 🛋️ Lounge 🛋️ ➳➳',
	'▁▁▁ 📊 Status 📊 ▁▁▁',
	'╭✧➳ 📅 Events 📅 ➳✧╮',
	'┈┈┈ 📝 Reports 📝 ┈┈┈',
	'⎯⎯⎯ 🔖 Miscellaneous 🔖 ⎯⎯⎯',
	'✦✧ 📃 Bulletin 📃 ✧✦',
	'➩➩ 📢 Updates 📢 ➩➩',
	'╔════ General ⭐ ════',
	'╚═════ Chatroom 🎙',
	'☆☆☆ Fun ☆☆☆',
	'→→→ Announce →→→',
	'➜➜➜ Updates ➜➜➜',
	'〘 Info 〙',
	'【 News 】',
	'♪♪♪ Music ♪♪♪',
];

const PickerTextField: React.FC<PickerTextFieldProps> = ({
	label = 'Name',
	value,
	onChange,
	enableEmojiPicker = true,
	enableSpecialPicker = true,
	disabled = false, // Nehmen wir die disabled-Prop entgegen
}) => {
	const theme = useTheme();
	const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
	const [specialAnchorEl, setSpecialAnchorEl] = useState<null | HTMLElement>(null);

	const handleEmojiClick = (event: React.MouseEvent<HTMLElement>) => {
		setEmojiAnchorEl(event.currentTarget);
	};
	const handleEmojiClose = () => {
		setEmojiAnchorEl(null);
	};

	const handleSpecialClick = (event: React.MouseEvent<HTMLElement>) => {
		setSpecialAnchorEl(event.currentTarget);
	};
	const handleSpecialClose = () => {
		setSpecialAnchorEl(null);
	};

	const openEmoji = Boolean(emojiAnchorEl);
	const openSpecial = Boolean(specialAnchorEl);

	// EmojiPicker aus emoji-picker-react
	const onEmojiSelect = (emojiData: EmojiClickData, event: MouseEvent) => {
		onChange(value + emojiData.emoji);
		handleEmojiClose();
	};

	const handleSpecialSelect = (char: string) => {
		onChange(value + char);
		handleSpecialClose();
	};

	return (
		<div>
			<TextField
				fullWidth
				label={label}
				variant="outlined"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled} // Geben wir an TextField weiter
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							{enableEmojiPicker && (
								<IconButton onClick={handleEmojiClick} edge="end" disabled={disabled}>
									<EmojiIcon />
								</IconButton>
							)}
							{enableSpecialPicker && (
								<IconButton onClick={handleSpecialClick} edge="end" disabled={disabled}>
									<SpecialIcon />
								</IconButton>
							)}
						</InputAdornment>
					),
				}}
			/>
			{enableEmojiPicker && (
				<Popover
					open={openEmoji}
					anchorEl={emojiAnchorEl}
					onClose={handleEmojiClose}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'center',
					}}
				>
					<Box sx={{ p: 2 }}>
						<EmojiPicker onEmojiClick={onEmojiSelect} />
					</Box>
				</Popover>
			)}
			{enableSpecialPicker && (
				<Popover
					open={openSpecial}
					anchorEl={specialAnchorEl}
					onClose={handleSpecialClose}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'center',
					}}
					PaperProps={{ sx: { maxHeight: 300, overflow: 'auto', width: 300 } }}
				>
					<Box sx={{ p: 2 }}>
						{specialCharGroups.map((group) => (
							<Box key={group.group} sx={{ mb: 2 }}>
								<Typography variant="subtitle2" sx={{ mb: 1 }}>
									{group.group}
								</Typography>
								<Grid container spacing={1}>
									{group.symbols.map((char, index) => (
										<Grid item key={`${char}-${index}`}>
											<MuiButton onClick={() => handleSpecialSelect(char)}>{char}</MuiButton>
										</Grid>
									))}
								</Grid>
							</Box>
						))}
						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>
								Examples
							</Typography>
							<Grid container spacing={1}>
								{specialCharExamples.map((example, index) => (
									<Grid item key={index}>
										<MuiButton onClick={() => handleSpecialSelect(example)}>{example}</MuiButton>
									</Grid>
								))}
							</Grid>
						</Box>
					</Box>
				</Popover>
			)}
		</div>
	);
};

const EmojiIcon: React.FC = () => (
	<span role="img" aria-label="emoji" style={{ fontSize: '1.25rem' }}>
		😊
	</span>
);

const SpecialIcon: React.FC = () => (
	<span role="img" aria-label="special" style={{ fontSize: '1.25rem' }}>
		★
	</span>
);

export default PickerTextField;