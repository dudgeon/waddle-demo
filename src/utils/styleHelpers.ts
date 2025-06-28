import { FlowStep } from '../constants/flowSteps';

export function getNodeClasses(step: FlowStep, isActive: boolean): string {
  let baseClasses = "relative p-3 rounded-xl border transition-all duration-500 backdrop-blur-sm ";
  
  if (isActive) {
    baseClasses += "scale-105 shadow-lg ";
    
    switch (step.color) {
      case 'blue':
        baseClasses += "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 ring-2 ring-blue-400 ring-opacity-30";
        break;
      case 'purple':
        baseClasses += "border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 ring-2 ring-purple-400 ring-opacity-30";
        break;
      case 'green':
        baseClasses += "border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-700 ring-2 ring-green-400 ring-opacity-30";
        break;
      case 'orange':
        baseClasses += "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 ring-2 ring-orange-400 ring-opacity-30";
        break;
      case 'red':
        baseClasses += "border-red-400 bg-gradient-to-br from-red-50 to-red-100 text-red-700 ring-2 ring-red-400 ring-opacity-30";
        break;
    }
  } else {
    baseClasses += "scale-100 border-gray-200 bg-white/80 text-gray-700 hover:shadow-md hover:scale-[1.02]";
  }
  
  return baseClasses;
}

export function getIconClasses(step: FlowStep, isActive: boolean): string {
  let baseClasses = "w-5 h-5 ";
  
  if (isActive) {
    switch (step.color) {
      case 'blue':
        baseClasses += "text-blue-600";
        break;
      case 'purple':
        baseClasses += "text-purple-600";
        break;
      case 'green':
        baseClasses += "text-green-600";
        break;
      case 'orange':
        baseClasses += "text-orange-600";
        break;
      case 'red':
        baseClasses += "text-red-600";
        break;
    }
  } else {
    baseClasses += "text-gray-500";
  }
  
  return baseClasses;
}

export function getIconBgClasses(step: FlowStep, isActive: boolean): string {
  let baseClasses = "p-2 rounded-lg ";
  
  if (isActive) {
    switch (step.color) {
      case 'blue':
        baseClasses += "bg-blue-200/50";
        break;
      case 'purple':
        baseClasses += "bg-purple-200/50";
        break;
      case 'green':
        baseClasses += "bg-green-200/50";
        break;
      case 'orange':
        baseClasses += "bg-orange-200/50";
        break;
      case 'red':
        baseClasses += "bg-red-200/50";
        break;
    }
  } else {
    baseClasses += "bg-gray-100";
  }
  
  return baseClasses;
} 