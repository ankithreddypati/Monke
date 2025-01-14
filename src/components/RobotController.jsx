





// import React, { useRef, useState, useEffect } from "react";
// import { RigidBody, CapsuleCollider } from "@react-three/rapier";
// import { useFrame } from "@react-three/fiber";
// import { Vector3 } from "three";
// import { Html, useKeyboardControls } from "@react-three/drei";
// import { RobotEnemy } from "./RobotEnemy";
// import { useGame } from "../context/GameContext";
// import { audioRecorderService } from "../services/audioRecorderService";
// import { audioManager } from "../services/AudioManager";

// export function RobotController({
//   playerRef,
//   chaseRange = 15,
//   attackRange = 3,
//   speed = 3,
//   ...props
// }) {
//   const { takeDamage } = useGame();
//   const robotRef = useRef(null);
//   const container = useRef();
//   const [currentAnimation, setCurrentAnimation] = useState("CharacterArmature|Idle");
//   const robotPos = useRef(new Vector3());
//   const DAMAGE_COOLDOWN = 1000;
//   const lastDamageTime = useRef(0);
//   const isAttacking = useRef(false);

//   // States
//   const [isListening, setIsListening] = useState(false);
//   const [showPrompt, setShowPrompt] = useState(false);
//   const [hasAnswered, setHasAnswered] = useState(false);
//   const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);

//   // Keyboard controls
//   const [, get] = useKeyboardControls();

//   const handleStartTalking = async () => {
//     if (isQuestionPlaying) return;
    
//     setIsQuestionPlaying(true);
//     setCurrentAnimation("CharacterArmature|Idle");

//     // Play robot's question first
//     await audioManager.playSound('robotquestion', {
//       volume: 1,
//       onEnd: () => {
//         setIsQuestionPlaying(false);
//         setShowPrompt(true);
//       }
//     });
//   };

//   const handleStartRecording = async () => {
//     setIsListening(true);
    
//     const started = await audioRecorderService.startRecording(async (audioData) => {
//       try {
//         const response = await fetch(`${import.meta.env.VITE_API_URL}/consciousness`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             audio: audioData.data,
//             isGuest: true 

//           })
//         });

//         if (response.ok) {
//           setHasAnswered(true);
//         }
//       } catch (error) {
//         console.error('Error sending audio:', error);
//       } finally {
//         handleStopRecording();
//       }
//     });

//     if (!started) {
//       setIsListening(false);
//       setCurrentAnimation("CharacterArmature|Idle");
//     }
//   };

//   const handleStopRecording = () => {
//     audioRecorderService.stopRecording();
//     setIsListening(false);
//   };

//   useFrame(() => {
//     if (!robotRef.current || !playerRef?.current) return;

//     const robotPosition = new Vector3().fromArray(
//       Object.values(robotRef.current.translation())
//     );
//     const playerPosition = new Vector3().fromArray(
//       Object.values(playerRef.current.translation())
//     );
//     const distance = Math.sqrt(
//       Math.pow(robotPosition.x - playerPosition.x, 2) + 
//       Math.pow(robotPosition.z - playerPosition.z, 2)
//     );

//     // Handle initial approach and question
//     if (distance < attackRange && !isQuestionPlaying && !hasAnswered && !showPrompt) {
//       handleStartTalking();
//     }

//     // Handle recording after question is played
//     const isTalkKeyPressed = get().talk;
//     if (showPrompt && !isListening && isTalkKeyPressed && !hasAnswered) {
//       handleStartRecording();
//     } else if (isListening && !isTalkKeyPressed) {
//       handleStopRecording();
//     }

//     // Movement logic
//     if (!hasAnswered) {
//       if (distance < chaseRange && distance > attackRange && !isQuestionPlaying) {
//         // Approach player
//         setCurrentAnimation("CharacterArmature|Run");
//         const direction = new Vector3().subVectors(playerPosition, robotPosition).normalize();
//         robotRef.current.setLinvel(
//           { 
//             x: direction.x * (speed * 0.5), 
//             y: robotRef.current.linvel().y, 
//             z: direction.z * (speed * 0.5) 
//           },
//           true
//         );
//         container.current.rotation.y = Math.atan2(direction.x, direction.z);
//       } else {
//         // Idle
//         setCurrentAnimation("CharacterArmature|Idle");
//         robotRef.current.setLinvel(
//           { 
//             x: 0, 
//             y: robotRef.current.linvel().y, 
//             z: 0 
//           },
//           true
//         );
//       }
//     }
//   });

//   return (
//     <RigidBody
//       ref={robotRef}
//       colliders={false}
//       lockRotations
//       {...props}
//     >
//       <group ref={container}>
//         <RobotEnemy 
//           scale={3} 
//           position-y={1.2}
//           animation={currentAnimation}
//         />
//         <CapsuleCollider 
//           args={[0.5, 2]} 
//           position={[0, 3.2, 0]} 
//         />

//         {showPrompt && !isListening && !hasAnswered && (
//           <Html center position={[0, 4, 0]}>
//             <div style={{
//               background: 'rgba(0, 0, 0, 0.8)',
//               color: 'white',
//               padding: '8px 16px',
//               borderRadius: '4px',
//               fontFamily: 'Arial',
//               fontSize: '14px',
//               whiteSpace: 'nowrap',
//             }}>
//               Hold T to respond
//             </div>
//           </Html>
//         )}

//         {isListening && (
//           <Html center position={[0, 4, 0]}>
//             <div style={{
//               background: 'rgba(220, 0, 0, 0.8)',
//               color: 'white',
//               padding: '8px 16px',
//               borderRadius: '4px',
//               fontFamily: 'Arial',
//               fontSize: '14px',
//               whiteSpace: 'nowrap',
//             }}>
//               Listening...
//             </div>
//           </Html>
//         )}
//       </group>
//     </RigidBody>
//   );
// }



import React, { useRef, useState } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { Html, useKeyboardControls } from "@react-three/drei";
import { RobotEnemy } from "./RobotEnemy";
import { audioRecorderService } from "../services/audioRecorderService";
import { audioManager } from "../services/AudioManager";

export function RobotController({
 playerRef,
 chaseRange = 15,
 attackRange = 3, 
 speed = 3,
 ...props
}) {
 const robotRef = useRef(null);
 const container = useRef();
 const [currentAnimation, setCurrentAnimation] = useState("CharacterArmature|Idle");

 // States
 const [isListening, setIsListening] = useState(false);
 const [showPrompt, setShowPrompt] = useState(false);
 const [hasAnswered, setHasAnswered] = useState(false);
 const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);
 const [shouldMoveAway, setShouldMoveAway] = useState(false);

 // Keyboard controls
 const [, get] = useKeyboardControls();

 const handleStartTalking = async () => {
   if (isQuestionPlaying) return;
   
   setIsQuestionPlaying(true);
   setCurrentAnimation("CharacterArmature|Idle");

   await audioManager.playSound('robotquestion', {
     volume: 1,
     onEnd: () => {
       setIsQuestionPlaying(false);
       setShowPrompt(true);
     }
   });
 };

 const handleStartRecording = async () => {
   setIsListening(true);
   
   const started = await audioRecorderService.startRecording(async (audioData) => {
     handleStopRecording();

     try {
       fetch(`${import.meta.env.VITE_API_URL}/consciousness`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ audio: audioData.data, isGuest: true })
       }).catch(() => {});
     } catch (error) {
       // Ignore any errors
     }
     
     // Play second audio before flying away
     await audioManager.playSound('robotquestion2', {
       volume: 1,
       onEnd: () => {
         setHasAnswered(true);
         setShouldMoveAway(true);
       }
     });
   });

   if (!started) {
     setIsListening(false);
     setCurrentAnimation("CharacterArmature|Idle");
     
     // Even if recording fails, play second audio and fly away
     await audioManager.playSound('robotquestion2', {
       volume: 1,
       onEnd: () => {
         setHasAnswered(true);
         setShouldMoveAway(true);
       }
     });
   }
 };

 const handleStopRecording = () => {
   audioRecorderService.stopRecording();
   setIsListening(false);
 };

 useFrame(() => {
   if (!robotRef.current || !playerRef?.current) return;

   const robotPosition = new Vector3().fromArray(
     Object.values(robotRef.current.translation())
   );
   const playerPosition = new Vector3().fromArray(
     Object.values(playerRef.current.translation())
   );

   const distance = Math.sqrt(
     Math.pow(robotPosition.x - playerPosition.x, 2) + 
     Math.pow(robotPosition.z - playerPosition.z, 2)
   );

   // After answering and second audio, fly straight up
   if (shouldMoveAway) {
     setCurrentAnimation("CharacterArmature|Idle");
     
     robotRef.current.setLinvel({ 
       x: 0,
       y: speed * 3,
       z: 0 
     }, true);

     if (robotPosition.y > 50) {
       setShouldMoveAway(false);
     }
     return;
   }

   // Initial approach and question
   if (distance < attackRange && !isQuestionPlaying && !hasAnswered && !showPrompt) {
     handleStartTalking();
   }

   // Handle recording input
   const isTalkKeyPressed = get().talk;
   if (showPrompt && !isListening && isTalkKeyPressed && !hasAnswered) {
     handleStartRecording();
   } else if (isListening && !isTalkKeyPressed) {
     handleStopRecording();
   }

   // Normal approach movement
   if (!hasAnswered && !shouldMoveAway) {
     if (distance < chaseRange && distance > attackRange && !isQuestionPlaying) {
       setCurrentAnimation("CharacterArmature|Run");
       const direction = new Vector3().subVectors(playerPosition, robotPosition);
       const approachDirection = direction.normalize();
       robotRef.current.setLinvel({ 
         x: approachDirection.x * (speed * 0.5), 
         y: robotRef.current.linvel().y, 
         z: approachDirection.z * (speed * 0.5) 
       }, true);
       container.current.rotation.y = Math.atan2(approachDirection.x, approachDirection.z);
     } else {
       setCurrentAnimation("CharacterArmature|Idle");
       robotRef.current.setLinvel({ 
         x: 0, 
         y: robotRef.current.linvel().y, 
         z: 0 
       }, true);
     }
   }
 });

 return (
   <RigidBody ref={robotRef} colliders={false} lockRotations {...props}>
     <group ref={container}>
       <RobotEnemy 
         scale={3} 
         position-y={1.2}
         animation={currentAnimation}
       />
       <CapsuleCollider args={[0.5, 2]} position={[0, 3.2, 0]} />

       {showPrompt && !isListening && !hasAnswered && (
         <Html center position={[0, 4, 0]}>
           <div style={{
             background: 'rgba(0, 0, 0, 0.8)',
             color: 'white',
             padding: '8px 16px',
             borderRadius: '4px',
             fontFamily: 'Arial',
             fontSize: '14px',
             whiteSpace: 'nowrap',
           }}>
             Hold T to respond
           </div>
         </Html>
       )}

       {isListening && (
         <Html center position={[0, 4, 0]}>
           <div style={{
             background: 'rgba(220, 0, 0, 0.8)',
             color: 'white',
             padding: '8px 16px',
             borderRadius: '4px',
             fontFamily: 'Arial',
             fontSize: '14px',
             whiteSpace: 'nowrap',
           }}>
             Listening...
           </div>
         </Html>
       )}
     </group>
   </RigidBody>
 );
}