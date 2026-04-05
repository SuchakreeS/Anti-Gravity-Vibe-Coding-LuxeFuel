const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const fuelRecordController = require('../controllers/fuelRecordController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', carController.createCar);
router.get('/', carController.getCars);
router.get('/:id', carController.getCar);
router.put('/:id', carController.updateCar);
router.delete('/:id', carController.deleteCar);

router.post('/:carId/records', fuelRecordController.addFuelRecord);
router.get('/:carId/records', fuelRecordController.getFuelRecords);
router.put('/:carId/records/:recordId', fuelRecordController.updateFuelRecord);
router.delete('/:carId/records/:recordId', fuelRecordController.deleteFuelRecord);

module.exports = router;
