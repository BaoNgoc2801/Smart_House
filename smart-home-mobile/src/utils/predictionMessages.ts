export function getPredictionMessage(activity: string): { title: string; body: string; speech: string } {
  const norm = activity.toLowerCase();
  
  if (norm.includes('sleep')) {
    return {
      title: 'Good night!',
      body: 'The lights and air conditioning have been adjusted for your comfort.',
      speech: 'Good night. The lights and air conditioning have been turned on to help you have a good sleep.'
    };
  }
  if (norm.includes('relax')) {
    return {
      title: 'Time to relax!',
      body: "We've dimmed the lights to help you unwind.",
      speech: 'Time to relax. We have dimmed the lights to help you unwind.'
    };
  }
  if (norm.includes('work') || norm.includes('study')) {
    return {
      title: 'Focus time!',
      body: 'Bright lights and optimal temperature are set for your productivity.',
      speech: 'Focus time. Bright lights and optimal temperature are set for your productivity.'
    };
  }
  if (norm.includes('leave') || norm.includes('away') || norm.includes('out')) {
    return {
      title: 'Goodbye!',
      body: 'All devices have been turned off to save energy.',
      speech: 'Goodbye. All devices have been turned off to save energy.'
    };
  }
  if (norm.includes('enter') || norm.includes('arrive') || norm.includes('home')) {
    return {
      title: 'Welcome home!',
      body: 'Your preferred settings have been restored.',
      speech: 'Welcome home. Your preferred settings have been restored.'
    };
  }
  if (norm.includes('personal') || norm.includes('care')) {
    return {
      title: 'Self Care',
      body: 'Bathroom lights and ventilation are running.',
      speech: 'Self care time. Bathroom lights and ventilation are on.'
    };
  }
  
  // Default fallback
  const fallbackActivity = activity.replace('_', ' ');
  return {
    title: 'Activity Predicted',
    body: `System predicts you are engaging in: ${fallbackActivity}`,
    speech: `Predicted activity is ${fallbackActivity}.`
  };
}
