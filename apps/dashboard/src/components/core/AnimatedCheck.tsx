// apps/dashboard/src/core/AnimatedCheck.tsx

import React from 'react';

const AnimatedCheck: React.FC = () => (
	<>
		<style>
			{`
        .icons-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .icons-animation {
          position: relative;
        }
        .icons-animation svg {
          width: 90px;
          height: 102px;
          transform-origin: center;
        }
        .explosion {
          z-index: 3;
        }
        .explosion circle {
          animation: circle-explosion 1s cubic-bezier(0.77, 0, 0.175, 1) forwards;
          transform-origin: center;
          opacity: 0;
        }
        @keyframes circle-explosion {
          0% {
            opacity: 1;
            stroke-width: 40;
            transform: scale(0);
          }
          100% {
            opacity: 1;
            stroke-width: 2;
            transform: scale(1);
          }
        }
        .explosion path {
          animation: path-explosion 2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
          transform-origin: center;
          stroke-dasharray: 1, 40;
          stroke-dashoffset: 0;
          opacity: 0;
        }
        @keyframes path-explosion {
          0%, 12% {
            opacity: 0;
          }
          12.5% {
            stroke-dasharray: 15, 40;
            stroke-dashoffset: -40;
            opacity: 1;
            stroke-width: 3;
            transform: rotate(0);
          }
          50%, 100% {
            stroke-dasharray: 1, 40;
            stroke-dashoffset: 2;
            stroke-width: 0;
            transform: rotate(0);
          }
        }
        .explosion .check {
          animation: check 2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
          animation-delay: 0.25s;
          stroke-dasharray: 40, 40;
          stroke-dashoffset: 40;
        }
        @keyframes check {
          0%, 12% {
            opacity: 0;
          }
          12.5% {
            opacity: 1;
          }
          50%, 100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}
		</style>
		<div className="icons-wrap">
			<div className="icons-animation">
				<svg className="explosion" viewBox="0 0 90 102" xmlns="http://www.w3.org/2000/svg">
					<g transform="translate(1 1)" stroke="#0F9848" fill="none" fillRule="evenodd">
						<circle strokeWidth="10" cx="44" cy="50" r="27" />
						<path
							className="check"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M33 50.578l8.911 9.542L55 39"
						/>
						<path
							d="M44 0v40m43.301-15l-34.64 20M87.3 75L52.66 55M44 100V60M.699 75l34.64-20M.7 25l34.64 20"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</g>
				</svg>
			</div>
		</div>
	</>
);

export default AnimatedCheck;
