import Blockly from 'scratch-blocks';

// Machine Learning Blocks Messages
// The %1, %2, %3, %4 parameters map to the block inputs defined in the XML structure

// Canvas Definition
Blockly.Msg.ML_SET_CANVAS_AREA = 'set ml area x: %1 y: %2 width: %3 height: %4';

// Data Collection
Blockly.Msg.ML_LEARN_FROM_COSTUMES = 'learn all costumes as %1';
Blockly.Msg.ML_SAVE_CURRENT_AREA = 'learn current area as %1';

// Training
Blockly.Msg.ML_TRAIN_MODEL = 'train ml model';

// Prediction & Feedback
Blockly.Msg.ML_GET_PREDICTION = 'ml area prediction';
Blockly.Msg.ML_GET_CONFIDENCE = 'ml area confidence %';

// Optional: Spanish translations for the local build
// If your mod handles localization through Scratch's l10n system, you would add these to the es.json file
/*
  "ML_SET_CANVAS_AREA": "establecer área ml en x: %1 y: %2 ancho: %3 alto: %4",
  "ML_LEARN_FROM_COSTUMES": "aprender todos los disfraces como %1",
  "ML_LEARN_CURRENT_AREA": "aprender área actual como %1",
  "ML_TRAIN_MODEL": "entrenar modelo ml",
  "ML_GET_PREDICTION": "predicción del área ml",
  "ML_GET_CONFIDENCE": "confianza del área ml %"
*/