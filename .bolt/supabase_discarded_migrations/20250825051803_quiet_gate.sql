@@ .. @@
 ALTER TABLE heating_data ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Users can insert heating data"
+CREATE POLICY "Anyone can access heating data"
   ON heating_data
-  FOR INSERT
-  TO authenticated
-  WITH CHECK (true);
-
-CREATE POLICY "Users can read heating data"
-  ON heating_data
-  FOR SELECT
-  TO authenticated
-  USING (true);
-
-CREATE POLICY "Users can update heating data"
-  ON heating_data
-  FOR UPDATE
-  TO authenticated
-  USING (true);
-
-CREATE POLICY "Users can delete heating data"
-  ON heating_data
-  FOR DELETE
-  TO authenticated
-  USING (true);