-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: mysql_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_concept`
--

DROP TABLE IF EXISTS `app_concept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_concept` (
  `node_ptr_id` int NOT NULL,
  `related_topic_id` int NOT NULL,
  PRIMARY KEY (`node_ptr_id`),
  KEY `app_concept_related_topic_id_7980faab_fk_app_topic_node_ptr_id` (`related_topic_id`),
  CONSTRAINT `app_concept_node_ptr_id_3affab0c_fk_app_node_id` FOREIGN KEY (`node_ptr_id`) REFERENCES `app_node` (`id`),
  CONSTRAINT `app_concept_related_topic_id_7980faab_fk_app_topic_node_ptr_id` FOREIGN KEY (`related_topic_id`) REFERENCES `app_topic` (`node_ptr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_concept`
--

LOCK TABLES `app_concept` WRITE;
/*!40000 ALTER TABLE `app_concept` DISABLE KEYS */;
INSERT INTO `app_concept` VALUES (5,1),(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),(12,1),(13,1),(14,1),(15,2),(16,2),(17,2),(18,2),(19,2),(20,2),(21,2),(22,2),(23,2),(24,2),(25,2),(26,2),(27,2),(28,2),(29,2),(30,2),(31,3),(32,3),(33,3),(34,3),(35,3),(36,3),(37,3),(38,3),(39,3),(40,3),(41,3),(42,3),(43,3),(44,3),(45,3),(46,3),(47,3),(48,3),(49,3),(50,3),(51,4),(52,4),(53,4),(54,4),(55,4),(56,4),(57,4),(58,4),(59,4),(60,4),(61,4),(62,4),(63,4),(64,4),(65,4);
/*!40000 ALTER TABLE `app_concept` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_module`
--

DROP TABLE IF EXISTS `app_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_module` (
  `id` int NOT NULL,
  `index` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_module`
--

LOCK TABLES `app_module` WRITE;
/*!40000 ALTER TABLE `app_module` DISABLE KEYS */;
INSERT INTO `app_module` VALUES (1,'MH2802','Linear Algebra ','2025-09-24 14:59:55.998320');
/*!40000 ALTER TABLE `app_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_node`
--

DROP TABLE IF EXISTS `app_node`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_node` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `summary` longtext NOT NULL,
  `module_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `app_node_module_id_02fa8ab6_fk_app_module_id` (`module_id`),
  CONSTRAINT `app_node_module_id_02fa8ab6_fk_app_module_id` FOREIGN KEY (`module_id`) REFERENCES `app_module` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_node`
--

LOCK TABLES `app_node` WRITE;
/*!40000 ALTER TABLE `app_node` DISABLE KEYS */;
INSERT INTO `app_node` VALUES (1,'Introducing the Matrix','Overview of Matrix concepts',1),(2,'Linear Transforms and the Matrix','Overview of Linear Transforms concepts',1),(3,'Manipulating the Matrix','Overview of Manipulating Matrix concepts',1),(4,'Inverting the Matrix','Overview of Inverting Matrix concepts',1),(5,'Vector Application','Vectors used for data representation such as displacement, velocity, probabilities, time series data \r\n\r\n',1),(6,'Difference between Set and Vectors','Sets are unordered and Vectors are ordered ',1),(7,'Vector Norm','The vector norm, also known as the magnitude or length of a vector, measures the size of the vector. It is calculated using the square root of the sum of the squares of its components, representing the \'distance\' of the vector from the origin in space.',1),(8,'Vector Addition','Vector addition is the operation of adding two vectors by summing their corresponding components. The result is a new vector that represents the combined effect of the two vectors\' magnitudes and directions.',1),(9,'Scalar Vector Multiplication','Scalar vector multiplication involves multiplying each component of a vector by a scalar. This operation scales the vector\'s magnitude by the scalar, without changing its direction (unless the scalar is negative).',1),(10,'Unit Vectors','Unit vectors are vectors with a magnitude of 1. They are used to represent direction, and any vector can be converted into a unit vector by dividing it by its magnitude.',1),(11,'Transpose Vector','The transpose of a vector involves converting a column vector into a row vector (or vice versa). This operation is crucial in matrix operations and is often used in linear transformations.',1),(12,'Column Vector','A column vector is a matrix with a single column of numbers, representing a point or direction in space. It is commonly used in systems of equations and matrix multiplication.',1),(13,'Row Vector','A row vector is a matrix with a single row of numbers. It represents a vector in a horizontal form, often used in matrix operations and for transposition in mathematical calculations.',1),(14,'Special Basis Vector','Special basis vectors, also known as standard basis vectors, are a set of vectors that form the foundation of a vector space. In n-dimensional space, they are typically denoted as e₁, e₂, ..., eₙ, where each vector has a magnitude of 1 and is aligned with one of the axes. For example, in 3D space, e₁ = [1, 0, 0], e₂ = [0, 1, 0], and e₃ = [0, 0, 1]. These vectors provide a reference frame for expressing other vectors in terms of their components along the axes.',1),(15,'Transformation','Transformations describe how objects move or change. Examples include rotation, scaling, and projection.\r\nA transformation T maps an input vector to an output vector, often described as \r\nT(u) = [T₁(u₁, u₂), T₂(u₁, u₂)]ᵀ.\r\n ',1),(16,'Linear Transformation','A transformation T: ℝⁿ → ℝᵐ is linear if: T(αv + βu) = αT(v) + βT(u). A function between vector spaces that preserves vector addition and scalar multiplication, often represented by a matrix.',1),(17,'Linear Transformation Examples','Example 1: T(x, y) = (x², y) → Not linear \r\nSquaring x breaks scalar multiplication.\r\nExample 2: T(x, y) = (y, x) → Linear',1),(18,'Matrix Representation of Linear Transformation ','Any linear transformation can be represented as a matrix A such that T(v) = Av. Matrix A is formed from the transformed basis vectors: A = [T(e₁), T(e₂), ..., T(eₙ)].  A is built by checking what happens to each basis vector.',1),(19,'Rotation by 90° (Counterclockwise) Transformation','T(e₁) = [0, 1], T(e₂) = [-1, 0] → A = [0, -1; 1, 0]\r\n',1),(20,'Rotation by angle φ Transformation','T(e₁) = [cos(φ), sin(φ)], T(e₂) = [-sin(φ), cos(φ)] → A = [cos(φ), -sin(φ); sin(φ), cos(φ)]',1),(21,'Reflection over y = x Transformation','A = [0, 1; 1, 0]',1),(22,'Vertical Stretch by k Transformation','A = [1, 0; 0, k]',1),(23,'Horizontal Shear by k Transformation','A = [1, k; 0, 1]',1),(24,'Vertical Shear by k Transformation','A = [1, 0; k, 1]',1),(25,'Component Extraction','To extract the kth component: A = eₖᵀ',1),(26,'Integration as a Linear Transformation','∫₀ᵏ [a·f(x) + b·g(x)] dx = a·∫₀ᵏ f(x) dx + b·∫₀ᵏ g(x) dx',1),(27,'Matrix Addition','The operation of adding two matrices of the same dimensions by adding their corresponding entries.',1),(28,'Matrix Multiplication','A way of combining two matrices to produce a new matrix, where each entry is the dot product of a row from the first matrix and a column from the second.',1),(29,'Identity Matrix','A special square matrix with 1s on the diagonal and 0s elsewhere. When multiplied with another matrix, it leaves the matrix unchanged.',1),(30,'Matrix Transpose','Transpose flips rows to columns: Aᵀ turns an m×n matrix into n×m by turning columns into rows.',1),(31,'Intuition for Matrix Operation','We\'ve studied linear scalar maps for years, for example:\r\nT(x) = a₁₁ x (1x1 matrix is just a scalar)\r\nWe can generalize these operations to matrices as well.',1),(32,'Identity Matrix Detailed','The identity matrix Iₙ represents the action of doing nothing on Rⁿ.\r\nThe number 1 represents the scalar operation:\r\n1x = x, i.e., identity matrix leaves vectors unchanged.\r\nFor any vector v, Iₙ v = v.',1),(33,'The Zero Matrix ','The zero matrix maps any vector to zero.\r\nThe matrix [0] represents mapping all inputs to zero.\r\nA zero matrix with all entries 0 will make any input vector zero.',1),(34,'Matrix Equality','Two matrices A and B are equal if they transform all vectors the same way.\r\nFor matrices to be equal, they must transform every basis vector eₖ the same.\r\nThus, A eₖ = B eₖ for all k.',1),(35,'Matrix Addition Detailed','For two matrices A and B, matrix addition is defined as:\r\nC = A + B, where each element cᵢⱼ = aᵢⱼ + bᵢⱼ.\r\nThis means we add corresponding elements of A and B.',1),(36,'Matrix Addition Example','Example: If A = [[1, 0], [0, 1]] and B = [[0, -1], [1, 0]],\r\nthen A + B = [[1, -1], [1, 1]].',1),(37,'Matrix Scalar Multiplication Detailed','Matrix scalar multiplication is defined as multiplying each element of the matrix by a scalar.\r\nFor example, for a matrix A and scalar α, we get αA.',1),(38,'Rules of Matrix Arithmetic','The rules of matrix arithmetic, such as distributivity and associativity, hold element-wise, similar to standard arithmetic.',1),(39,'Application: Conditions for Orthogonality','Vectors u and v are orthogonal if:\r\nuᵀ v = 0, meaning their dot product is zero.\r\nThis defines the condition for two vectors being orthogonal in n-dimensional space.',1),(40,'Angles in N-Dimensions','We can generalize the angle between two vectors u and v using the cosine rule:\r\ncos(θ) = (uᵀ v) / (||u|| ||v||)\r\nThis formula generalizes the angle calculation to n-dimensional space.',1),(41,'Matrix-Matrix Multiplication','When we chain two transformations U and T, described by matrices A and B, respectively, the resulting matrix C is the matrix product C = AB.\r\nMatrix multiplication is **not commutative**, meaning AB ≠ BA.',1),(42,'Matrix Multiplication Example','Example: If A is a rotation matrix and B is a reflection matrix,\r\nthe matrix AB applies the reflection first and then the rotation.',1),(43,'Non-Commutativity of Matrix Multiplication','Matrix multiplication is **not commutative**. This means that the order in which matrices are multiplied matters.\r\nFor example, multiplying a rotation matrix by a reflection matrix does not yield the same result as reflecting first and then rotating.',1),(44,'Similarities with Standard Multiplication','Matrix multiplication follows many of the same properties as standard multiplication, such as associativity and distributivity:\r\nAssociative: A(BC) = (AB)C\r\nDistributive: A(B + C) = AB + AC',1),(45,'Matrix Powers','We can take powers of matrices, such as A² = A ⋅ A and A³ = A ⋅ A ⋅ A.\r\nMatrix powers represent repeated application of the same transformation.',1),(46,'The Zeroth Power','The zeroth power of a matrix is the **identity matrix** A⁰ = Iₙ.',1),(47,'Matrix Inverse','The matrix inverse A⁻¹ is the matrix that undoes the transformation of matrix A, such that:\r\nA⁻¹ A = I',1),(48,'Matrix Inverse Example','For a rotation matrix A, the inverse is simply the **reverse** of the original transformation (i.e., clockwise instead of counterclockwise).',1),(49,'Matrix Inverse: Existence','The inverse of a matrix does not exist for matrices that project vectors onto lower dimensions, like projection matrices.',1),(50,'Matrix Inverse: Motivation','The inverse matrix is useful for undoing transformations in processes like forensics and retrodiction (e.g., finding the original input given the output).',1),(51,'Diagonalization','',1),(52,'Matrix Inversion Characteristics','All invertible matrices are square.\r\nIf A is invertible, then A⁻¹ is also invertible.\r\nA⁻¹ A = A A⁻¹ = I\r\nMatrix inversion is an essential concept for solving linear equations.',1),(53,'Solving Linear Equations','We can solve linear equations by writing them as matrix equations:\r\nFor A x = b, we can solve for x using matrix inversion.\r\nThis is equivalent to solving a system of n linear equations for the unknowns in x.',1),(54,'Solving System of Equations','To solve a system using matrix equations, we use the augmented matrix approach.\r\nFor example, solving:\r\n 1x + 2y - z = 4\r\n 2x + 7y + z = 14\r\n 3x + 8y - z = 17',1),(55,'Row Reduction','The row reduction method (also known as Gaussian elimination) is a systematic way to solve linear equations.\r\nRow operations include:\r\n• Row swapping\r\n• Row multiplication by a scalar\r\n• Row addition',1),(56,'The Gaussian Row Reduction Algorithm','Steps:\r\n1. Find a non-zero entry in the first column.\r\n2. Swap rows to bring this entry to the top.\r\n3. Use row addition to make all other entries in the column zero.\r\n4. Repeat for the remaining sub-matrix until the system is in echelon form.',1),(57,'The Gauss-Jordan Reduction','The Gauss-Jordan method extends Gaussian elimination to reduce the matrix to reduced row echelon form (RREF).\r\nThis form simplifies finding the solutions to the system.',1),(58,'Pathological Scenarios: Inconsistent Equations','If a system has an equation like 0 = 1, then the system has no solution.',1),(59,'Pathological Scenarios: Non-Unique Solutions','When a system of equations has many solutions, it indicates that the matrix is singular and not invertible.',1),(60,'Back to Matrix Inversion','To find the inverse of a matrix, we solve multiple linear equations.\r\nFor a given matrix A, the inverse A⁻¹ is found by solving A x_j = e_j for each column vector e_j.',1),(61,'The Matrix Inversion Algorithm','We perform row reduction on the augmented matrix [A | I] to transform it into [I | A⁻¹].\r\nThis method efficiently finds the inverse of a matrix.',1),(62,'Example: Find the Inverse of a Matrix','Example: Find the inverse of a given matrix using the Gauss-Jordan method.\r\nYou can also apply the row reduction steps to find the inverse manually.',1),(63,'Closed Form for Inverses (2x2 Matrices)','For 2x2 matrices, the inverse can be found using the formula:\r\nIf A = [[a, b], [c, d]], then\r\nThe inverse is given by:\r\nA⁻¹ = (1 / (ad - bc)) [[d, -b], [-c, a]]\r\nThis formula only works if (ad - bc) ≠ 0, i.e., the determinant is non-zero.',1),(64,'Introducing the Determinant','The determinant of a matrix A, denoted det(A), is a scalar value that indicates whether a matrix is invertible.\r\nA matrix is invertible if and only if its determinant is non-zero.\r\nFor a 2x2 matrix A = [[a, b], [c, d]], the determinant is:\r\ndet(A) = (ad - bc)',1),(65,'Application: Hitboxes in Training','In games, hitboxes are used to detect collisions. To efficiently check if an object intersects a target, we use matrix transformations.\r\nBy applying the inverse transformation, we can determine whether the object is inside the target area (hitbox).',1);
/*!40000 ALTER TABLE `app_node` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_relationship`
--

DROP TABLE IF EXISTS `app_relationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_relationship` (
  `id` int NOT NULL,
  `rs_type` varchar(255) NOT NULL,
  `first_node_id` int NOT NULL,
  `second_node_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `app_relationship_first_node_id_d9228c26_fk_app_node_id` (`first_node_id`),
  KEY `app_relationship_second_node_id_878cc5be_fk_app_node_id` (`second_node_id`),
  CONSTRAINT `app_relationship_first_node_id_d9228c26_fk_app_node_id` FOREIGN KEY (`first_node_id`) REFERENCES `app_node` (`id`),
  CONSTRAINT `app_relationship_second_node_id_878cc5be_fk_app_node_id` FOREIGN KEY (`second_node_id`) REFERENCES `app_node` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_relationship`
--

LOCK TABLES `app_relationship` WRITE;
/*!40000 ALTER TABLE `app_relationship` DISABLE KEYS */;
INSERT INTO `app_relationship` VALUES (1,'is_subtopic',5,6),(2,'is_prerequisite',5,7),(3,'is_subtopic',5,8),(4,'is_corequisite',5,9),(5,'is_corequisite',6,7),(6,'is_subtopic',6,8),(7,'is_subtopic',7,10),(8,'is_prerequisite',8,9),(9,'is_subtopic',10,11),(10,'is_corequisite',11,12),(11,'is_subtopic',12,13),(12,'is_prerequisite',13,14),(13,'is_corequisite',14,15),(14,'is_subtopic',15,16),(15,'is_prerequisite',16,17),(16,'is_corequisite',17,18),(17,'is_subtopic',18,19),(18,'is_prerequisite',19,20),(19,'is_corequisite',20,21),(20,'is_subtopic',21,22),(21,'is_prerequisite',22,23),(22,'is_corequisite',23,24),(23,'is_subtopic',24,25),(24,'is_prerequisite',25,26),(25,'is_corequisite',26,27),(26,'is_subtopic',27,28),(27,'is_prerequisite',28,29),(28,'is_corequisite',29,30),(29,'is_subtopic',30,31),(30,'is_prerequisite',31,32),(31,'is_corequisite',32,33),(32,'is_subtopic',33,34),(33,'is_prerequisite',34,35),(34,'is_corequisite',35,36),(35,'is_subtopic',36,37),(36,'is_prerequisite',37,38),(37,'is_corequisite',38,39),(38,'is_subtopic',39,40),(39,'is_prerequisite',40,41),(40,'is_corequisite',41,42),(41,'is_subtopic',42,43),(42,'is_prerequisite',43,44),(43,'is_corequisite',44,45),(44,'is_subtopic',45,46),(45,'is_prerequisite',46,47),(46,'is_corequisite',47,48),(47,'is_subtopic',48,49),(48,'is_prerequisite',49,50),(49,'is_corequisite',50,51),(50,'is_subtopic',51,52),(51,'is_prerequisite',52,53),(52,'is_corequisite',53,54),(53,'is_subtopic',54,55),(54,'is_prerequisite',55,56),(55,'is_corequisite',56,57),(56,'is_subtopic',57,58),(57,'is_prerequisite',58,59),(58,'is_corequisite',59,60),(59,'is_subtopic',60,61),(60,'is_prerequisite',61,62),(61,'is_corequisite',62,63),(62,'is_subtopic',63,64),(63,'is_prerequisite',64,65),(64,'is_prerequisite',7,10),(65,'is_contrasted_with',12,13),(66,'is_prerequisite',14,18),(67,'is_prerequisite',16,18),(68,'is_applied_in',19,28),(69,'is_applied_in',20,28),(70,'is_applied_in',21,28),(71,'is_applied_in',22,28),(72,'is_applied_in',23,28),(73,'is_applied_in',24,28),(74,'is_prerequisite',27,38),(75,'is_prerequisite',28,43),(76,'is_prerequisite',29,47),(77,'is_corequisite',30,41),(78,'is_prerequisite',64,49),(79,'is_prerequisite',55,61),(80,'is_prerequisite',57,61),(81,'is_applied_in',47,65),(82,'is_prerequisite',39,40),(83,'is_corequisite',40,39),(84,'is_applied_in',16,65);
/*!40000 ALTER TABLE `app_relationship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_student`
--

DROP TABLE IF EXISTS `app_student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_student` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(254) NOT NULL,
  `learningStyle` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_student`
--

LOCK TABLES `app_student` WRITE;
/*!40000 ALTER TABLE `app_student` DISABLE KEYS */;
INSERT INTO `app_student` VALUES (1,'John Doe','johndoe@e.ntu.edu.sg',NULL);
/*!40000 ALTER TABLE `app_student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_student_enrolled_modules`
--

DROP TABLE IF EXISTS `app_student_enrolled_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_student_enrolled_modules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `module_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_student_enrolled_modules_student_id_module_id_a3fd2324_uniq` (`student_id`,`module_id`),
  KEY `app_student_enrolled_modules_module_id_e8191ee4_fk_app_module_id` (`module_id`),
  CONSTRAINT `app_student_enrolled_modules_module_id_e8191ee4_fk_app_module_id` FOREIGN KEY (`module_id`) REFERENCES `app_module` (`id`),
  CONSTRAINT `app_student_enrolled_modules_student_id_1da34bcb_fk` FOREIGN KEY (`student_id`) REFERENCES `app_student` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_student_enrolled_modules`
--

LOCK TABLES `app_student_enrolled_modules` WRITE;
/*!40000 ALTER TABLE `app_student_enrolled_modules` DISABLE KEYS */;
INSERT INTO `app_student_enrolled_modules` VALUES (1,1,1);
/*!40000 ALTER TABLE `app_student_enrolled_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_topic`
--

DROP TABLE IF EXISTS `app_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_topic` (
  `node_ptr_id` int NOT NULL,
  PRIMARY KEY (`node_ptr_id`),
  CONSTRAINT `app_topic_node_ptr_id_e4ee7521_fk_app_node_id` FOREIGN KEY (`node_ptr_id`) REFERENCES `app_node` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_topic`
--

LOCK TABLES `app_topic` WRITE;
/*!40000 ALTER TABLE `app_topic` DISABLE KEYS */;
INSERT INTO `app_topic` VALUES (1),(2),(3),(4);
/*!40000 ALTER TABLE `app_topic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add node',7,'add_node'),(26,'Can change node',7,'change_node'),(27,'Can delete node',7,'delete_node'),(28,'Can view node',7,'view_node'),(29,'Can add module',8,'add_module'),(30,'Can change module',8,'change_module'),(31,'Can delete module',8,'delete_module'),(32,'Can view module',8,'view_module'),(33,'Can add topic',9,'add_topic'),(34,'Can change topic',9,'change_topic'),(35,'Can delete topic',9,'delete_topic'),(36,'Can view topic',9,'view_topic'),(37,'Can add relationship',10,'add_relationship'),(38,'Can change relationship',10,'change_relationship'),(39,'Can delete relationship',10,'delete_relationship'),(40,'Can view relationship',10,'view_relationship'),(41,'Can add student',11,'add_student'),(42,'Can change student',11,'change_student'),(43,'Can delete student',11,'delete_student'),(44,'Can view student',11,'view_student'),(45,'Can add concept',12,'add_concept'),(46,'Can change concept',12,'change_concept'),(47,'Can delete concept',12,'delete_concept'),(48,'Can view concept',12,'view_concept');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$720000$WK25Jkj4zAJ6ehFRlrgeWi$EsVJMkJtL64biSFv7VouQkLTMSDVNOCgcDPWMh5oB/k=','2025-09-25 13:36:25.513836',1,'holly_admin','','','hzhang083@e.ntu.edu.sg',1,1,'2025-09-24 15:09:10.553237');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2025-09-24 16:12:12.685535','1','Student: John Doe',1,'[{\"added\": {}}]',11,1),(2,'2025-09-25 13:06:20.195626','1','Student: [<django.db.models.query_utils.DeferredAttribute object at 0x000001A34A1E4320>] John Doe',2,'[{\"changed\": {\"fields\": [\"LearningStyle\"]}}]',11,1);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(12,'app','concept'),(8,'app','module'),(7,'app','node'),(10,'app','relationship'),(11,'app','student'),(9,'app','topic'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-09-24 14:58:27.335342'),(2,'auth','0001_initial','2025-09-24 14:58:28.207930'),(3,'admin','0001_initial','2025-09-24 14:58:28.469814'),(4,'admin','0002_logentry_remove_auto_add','2025-09-24 14:58:28.482782'),(5,'admin','0003_logentry_add_action_flag_choices','2025-09-24 14:58:28.506859'),(6,'app','0001_initial','2025-09-24 14:58:29.508640'),(7,'contenttypes','0002_remove_content_type_name','2025-09-24 14:58:29.664224'),(8,'auth','0002_alter_permission_name_max_length','2025-09-24 14:58:29.761864'),(9,'auth','0003_alter_user_email_max_length','2025-09-24 14:58:29.792092'),(10,'auth','0004_alter_user_username_opts','2025-09-24 14:58:29.805527'),(11,'auth','0005_alter_user_last_login_null','2025-09-24 14:58:29.896689'),(12,'auth','0006_require_contenttypes_0002','2025-09-24 14:58:29.902317'),(13,'auth','0007_alter_validators_add_error_messages','2025-09-24 14:58:29.913014'),(14,'auth','0008_alter_user_username_max_length','2025-09-24 14:58:30.021309'),(15,'auth','0009_alter_user_last_name_max_length','2025-09-24 14:58:30.124928'),(16,'auth','0010_alter_group_name_max_length','2025-09-24 14:58:30.153411'),(17,'auth','0011_update_proxy_permissions','2025-09-24 14:58:30.173496'),(18,'auth','0012_alter_user_first_name_max_length','2025-09-24 14:58:30.277514'),(19,'sessions','0001_initial','2025-09-24 14:58:30.347735'),(20,'app','0002_load_nodes_and_relationships','2025-09-24 14:59:57.725828'),(21,'app','0003_student_learningstyle','2025-09-24 16:05:49.742474'),(22,'app','0004_alter_student_learningstyle','2025-09-24 16:29:57.706855'),(23,'app','0005_alter_student_id','2025-09-25 14:08:39.088368');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('iz9dsv6ugru1z6zadubk144bgqxojwnm','.eJxVjMsOwiAQRf-FtSEM5enSvd9ABhikaiAp7cr479qkC93ec859sYDbWsM2aAlzZmcG7PS7RUwPajvId2y3zlNv6zJHviv8oINfe6bn5XD_DiqO-q29AyzWeAmZgIRxHqUTmeKkseCkIMWC0UptlI6gigXwkoQlkGBFLuz9Ad1UN5U:1v1m93:PI4y66jvySXJEaxXnv-c7eTF83WAAPPxVAoL_Oji3ME','2025-10-09 13:36:25.523491');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-25 14:47:24
