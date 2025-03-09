// apps/dashboard/src/components/core/setup.stepper.tsx
import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';
import MobileStepper from '@mui/material/MobileStepper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export interface SetupStepperProps {
	steps: string[];
	activeStep: number;
	onStepClick?: (step: number) => void;
}

const SetupStepper: React.FC<SetupStepperProps> = ({ steps, activeStep, onStepClick }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	if (isMobile) {
		return (
			<MobileStepper
				variant="dots"
				steps={steps.length}
				position="static"
				activeStep={activeStep}
				nextButton={<></>}
				backButton={<></>}
				sx={{
					backgroundColor: 'transparent',
					justifyContent: 'center',
					'& .MuiMobileStepper-dot': {
						backgroundColor: theme.palette.grey[400],
					},
					'& .MuiMobileStepper-dotActive': {
						backgroundColor: theme.palette.primary.main,
					},
					mb: 2,
				}}
			/>
		);
	}

	return (
		<Stepper activeStep={activeStep} alternativeLabel>
			{steps.map((label, index) => (
				<Step key={index} onClick={() => onStepClick && onStepClick(index)}>
					<StepLabel>{label}</StepLabel>
				</Step>
			))}
		</Stepper>
	);
};

export default SetupStepper;
