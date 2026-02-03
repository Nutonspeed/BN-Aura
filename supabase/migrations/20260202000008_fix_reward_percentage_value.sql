UPDATE loyalty_rewards
SET monetary_value = 10
WHERE type = 'discount_percentage'
AND (monetary_value IS NULL OR monetary_value = 0)
AND name = 'ส่วนลด 10% ทุก Treatment';
