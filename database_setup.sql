-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS `transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `stock_id` varchar(250) NOT NULL,
  `transaction_per_stock` decimal(15,2) NOT NULL,
  `transaction_quantity` int(11) NOT NULL,
  `transaction_type` enum('BUY','SELL') NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `user_id` (`user_id`),
  KEY `stock_id` (`stock_id`),
  KEY `transaction_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Make sure stock_holdings table exists with correct structure
CREATE TABLE IF NOT EXISTS `stock_holdings` (
  `holding_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `stock_id` varchar(250) NOT NULL,
  `share_name` varchar(500) DEFAULT NULL,
  `share_quantity` int(11) NOT NULL DEFAULT '0',
  `share_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`holding_id`),
  KEY `user_id` (`user_id`),
  KEY `stock_id` (`stock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Make sure users table has balance column
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `balance` decimal(15,2) NOT NULL DEFAULT '10000.00';
